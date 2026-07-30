-- Client and Truck waitlists shown as grids on the dashboard.
--
-- Unlike most tables here, these rows are genuinely deleted rather than
-- soft-deleted: a waitlist entry is a short-lived note about who/what is
-- waiting for a load, not a historical record anything else references.

create table if not exists public.client_waitlist (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  from_city_id uuid not null references public.cities(id),
  to_city_id uuid not null references public.cities(id),
  truck_qty integer,
  load_date date not null default current_date,
  client_id uuid not null references public.clients(id),
  priority integer,
  comments text,
  created_at timestamptz not null default now()
);

create table if not exists public.truck_waitlist (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  from_city_id uuid not null references public.cities(id),
  to_city_id uuid not null references public.cities(id),
  truck_id uuid not null references public.trucks(id),
  load_date date not null default current_date,
  driver_id uuid references public.drivers(id),
  priority integer,
  comments text,
  created_at timestamptz not null default now()
);

alter table public.client_waitlist enable row level security;
alter table public.truck_waitlist enable row level security;

-- Active staff (admin or manager) get full read/write, including delete.
drop policy if exists "Staff can view client_waitlist" on public.client_waitlist;
create policy "Staff can view client_waitlist"
  on public.client_waitlist for select using (public.is_active_staff());

drop policy if exists "Staff can insert client_waitlist" on public.client_waitlist;
create policy "Staff can insert client_waitlist"
  on public.client_waitlist for insert with check (public.is_active_staff());

drop policy if exists "Staff can update client_waitlist" on public.client_waitlist;
create policy "Staff can update client_waitlist"
  on public.client_waitlist for update
  using (public.is_active_staff()) with check (public.is_active_staff());

drop policy if exists "Staff can delete client_waitlist" on public.client_waitlist;
create policy "Staff can delete client_waitlist"
  on public.client_waitlist for delete using (public.is_active_staff());

drop policy if exists "Staff can view truck_waitlist" on public.truck_waitlist;
create policy "Staff can view truck_waitlist"
  on public.truck_waitlist for select using (public.is_active_staff());

drop policy if exists "Staff can insert truck_waitlist" on public.truck_waitlist;
create policy "Staff can insert truck_waitlist"
  on public.truck_waitlist for insert with check (public.is_active_staff());

drop policy if exists "Staff can update truck_waitlist" on public.truck_waitlist;
create policy "Staff can update truck_waitlist"
  on public.truck_waitlist for update
  using (public.is_active_staff()) with check (public.is_active_staff());

drop policy if exists "Staff can delete truck_waitlist" on public.truck_waitlist;
create policy "Staff can delete truck_waitlist"
  on public.truck_waitlist for delete using (public.is_active_staff());
