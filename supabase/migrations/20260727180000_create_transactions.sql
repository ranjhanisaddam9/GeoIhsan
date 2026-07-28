-- Phase 7: transactions — the core record tying together locations, trucks,
-- drivers, clients, brokers, and commission.
--
-- Naming note: the original spec called these "senders"/"receivers"; those
-- were renamed to clients/brokers in Phase 5, so this table uses
-- client_id/broker_id referencing public.clients/public.brokers.
--
-- Auto-calculated fields (total_fare_charges, remaining_fare) are STORED
-- GENERATED columns computed directly from the base charge columns, not
-- chained through each other — Postgres disallows a generated column from
-- referencing another generated column, so remaining_fare re-derives the
-- charge sum independently rather than referencing total_fare_charges.
-- This guarantees both are always correct at the database level, no matter
-- how a row is written (not just enforced by the app form).

-- ---------------------------------------------------------------------------
-- Human-readable sequential transaction numbers (e.g. GI-000001). A plain
-- Postgres sequence + a small formatting function used as the column
-- default — every INSERT gets the next number automatically unless
-- explicitly overridden. Note sequences aren't transactional, so a failed
-- insert can leave a gap in the numbering; that's normal/expected for this
-- kind of human-readable counter (same as most invoice numbering schemes).
-- ---------------------------------------------------------------------------
create sequence if not exists public.transaction_number_seq;

create or replace function public.generate_transaction_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'GI-' || lpad(nextval('public.transaction_number_seq')::text, 6, '0');
$$;

-- ---------------------------------------------------------------------------
-- Keeps updated_at current on every UPDATE (a column default only fires
-- once, at INSERT).
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_number text not null unique
    default public.generate_transaction_number(),
  transaction_date date not null default current_date,

  from_location_id uuid not null references public.locations (id),
  to_location_id uuid not null references public.locations (id),
  truck_id uuid not null references public.trucks (id),
  driver_id uuid not null references public.drivers (id),
  client_id uuid not null references public.clients (id),
  broker_id uuid not null references public.brokers (id),

  item_name text not null,
  quantity numeric,
  description text,
  weight numeric,

  weighing_bridge_cost numeric not null default 0,
  loading_labour_charges numeric not null default 0,
  fare_charges numeric not null default 0,
  total_fare_charges numeric generated always as (
    weighing_bridge_cost + loading_labour_charges + fare_charges
  ) stored,

  advance_fare numeric not null default 0,
  remaining_fare numeric generated always as (
    (weighing_bridge_cost + loading_labour_charges + fare_charges) - advance_fare
  ) stored,

  care_of_details text,
  -- Pre-filled from app_settings.default_commission_amount by the app,
  -- editable per transaction. Never included on the printed receipt
  -- (later phase) — internal accounting only.
  commission_amount numeric not null default 0,

  is_voided boolean not null default false,
  void_reason text,

  created_by uuid not null references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create index if not exists transactions_transaction_date_idx
  on public.transactions (transaction_date);
create index if not exists transactions_truck_id_idx
  on public.transactions (truck_id);
create index if not exists transactions_driver_id_idx
  on public.transactions (driver_id);
create index if not exists transactions_client_id_idx
  on public.transactions (client_id);
create index if not exists transactions_broker_id_idx
  on public.transactions (broker_id);

alter table public.transactions enable row level security;

-- Staff (admin or manager, active) can read all transactions.
drop policy if exists "Staff can view transactions" on public.transactions;
create policy "Staff can view transactions"
  on public.transactions for select using (public.is_active_staff());

-- Staff can create transactions, but only attributed to themselves —
-- created_by must match the inserting user, so it can't be spoofed.
drop policy if exists "Staff can insert transactions" on public.transactions;
create policy "Staff can insert transactions"
  on public.transactions for insert
  with check (public.is_active_staff() and created_by = auth.uid());

-- Any active staff member can edit or void any transaction (not just the
-- one they created), consistent with how every other entity in this app
-- works.
drop policy if exists "Staff can update transactions" on public.transactions;
create policy "Staff can update transactions"
  on public.transactions for update
  using (public.is_active_staff()) with check (public.is_active_staff());

-- No delete policy: transactions are voided (is_voided = true, with a
-- void_reason), never deleted — they're financial records.
