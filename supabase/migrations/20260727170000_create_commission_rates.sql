-- Phase 6b: commission_rates — per-route (from city -> to city) commission
-- amounts. Historical rows are never deleted or overwritten in place, so
-- transactions (a later phase) can reference exactly which rate was in
-- effect when they were created; is_active marks which rate currently
-- applies to a route. Complements (does not replace) app_settings'
-- default_commission_amount, which is meant as a fallback when no
-- route-specific rate has been configured.

create table if not exists public.commission_rates (
  id uuid primary key default gen_random_uuid(),
  from_city_id uuid not null references public.cities (id),
  to_city_id uuid not null references public.cities (id),
  amount numeric(12, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Only one *active* rate per route at a time; any number of inactive
-- (expired/historical) rates are allowed for the same route.
create unique index if not exists commission_rates_active_route_idx
  on public.commission_rates (from_city_id, to_city_id)
  where is_active;

alter table public.commission_rates enable row level security;

-- Both admin and manager can read rates (needed to look up the applicable
-- commission when creating a transaction later); only admin can write.
drop policy if exists "Staff can view commission_rates" on public.commission_rates;
create policy "Staff can view commission_rates"
  on public.commission_rates for select using (public.is_active_staff());

drop policy if exists "Admins can insert commission_rates" on public.commission_rates;
create policy "Admins can insert commission_rates"
  on public.commission_rates for insert with check (public.is_admin());

drop policy if exists "Admins can update commission_rates" on public.commission_rates;
create policy "Admins can update commission_rates"
  on public.commission_rates for update
  using (public.is_admin()) with check (public.is_admin());

-- No delete policy: rates are expired (is_active = false), never deleted,
-- since transactions may reference them later.

-- Whenever a new active rate is added for a route, automatically expire the
-- previous active rate for that route. Runs BEFORE INSERT (not AFTER) so
-- the partial unique index above never sees two active rows for the same
-- route at once — by the time the new row's uniqueness is checked, the old
-- one has already been flipped to inactive in the same transaction.
create or replace function public.expire_previous_commission_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active then
    update public.commission_rates
    set is_active = false
    where from_city_id = new.from_city_id
      and to_city_id = new.to_city_id
      and is_active = true;
  end if;
  return new;
end;
$$;

drop trigger if exists on_commission_rate_insert on public.commission_rates;
create trigger on_commission_rate_insert
  before insert on public.commission_rates
  for each row execute function public.expire_previous_commission_rate();
