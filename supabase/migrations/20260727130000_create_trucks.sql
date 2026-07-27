-- Phase 3: trucks table with staff-only RLS (admin + manager, active profiles only).

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.trucks (
  id uuid primary key default gen_random_uuid(),
  truck_number text not null unique,
  truck_type text,
  capacity text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.trucks enable row level security;

-- ---------------------------------------------------------------------------
-- Reusable helper: true if the current user has an active admin/manager
-- profile. security definer isn't strictly required here (a trucks policy
-- querying profiles doesn't recurse the way a profiles policy querying
-- profiles would), but it's kept consistent with is_admin() from Phase 2
-- and reusable for drivers/clients/locations/transactions in later phases.
-- ---------------------------------------------------------------------------
create or replace function public.is_active_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'manager')
      and is_active = true
  );
$$;

-- Staff (admin or manager, active) can view all trucks.
drop policy if exists "Staff can view trucks" on public.trucks;
create policy "Staff can view trucks"
  on public.trucks
  for select
  using (public.is_active_staff());

-- Staff can add trucks.
drop policy if exists "Staff can insert trucks" on public.trucks;
create policy "Staff can insert trucks"
  on public.trucks
  for insert
  with check (public.is_active_staff());

-- Staff can edit trucks, including toggling is_active (soft delete).
drop policy if exists "Staff can update trucks" on public.trucks;
create policy "Staff can update trucks"
  on public.trucks
  for update
  using (public.is_active_staff())
  with check (public.is_active_staff());

-- No delete policy: trucks are deactivated (is_active = false), never
-- deleted, since they may be linked to historical transactions later.
