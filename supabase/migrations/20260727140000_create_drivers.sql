-- Phase 4: drivers table, driver_trucks join table, and staff-only RLS.

-- ---------------------------------------------------------------------------
-- Drivers
-- ---------------------------------------------------------------------------
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  father_name text,
  -- Pakistani CNIC: 13 digits, with or without the 5-7-1 dash grouping.
  -- Intentionally simple (no checksum/issuer validation).
  cnic text check (
    cnic is null
    or cnic ~ '^[0-9]{13}$'
    or cnic ~ '^[0-9]{5}-[0-9]{7}-[0-9]$'
  ),
  phone text,
  whatsapp text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.drivers enable row level security;

-- Staff (admin or manager, active) can view all drivers.
drop policy if exists "Staff can view drivers" on public.drivers;
create policy "Staff can view drivers"
  on public.drivers
  for select
  using (public.is_active_staff());

-- Staff can add drivers.
drop policy if exists "Staff can insert drivers" on public.drivers;
create policy "Staff can insert drivers"
  on public.drivers
  for insert
  with check (public.is_active_staff());

-- Staff can edit drivers, including toggling is_active (soft delete).
drop policy if exists "Staff can update drivers" on public.drivers;
create policy "Staff can update drivers"
  on public.drivers
  for update
  using (public.is_active_staff())
  with check (public.is_active_staff());

-- No delete policy: drivers are deactivated, never deleted, same as trucks.

-- ---------------------------------------------------------------------------
-- driver_trucks: many-to-many association between drivers and trucks.
-- Unlike drivers/trucks themselves, these link rows are not historical
-- records, so they can be freely deleted when an association is removed.
-- ---------------------------------------------------------------------------
create table if not exists public.driver_trucks (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers (id) on delete cascade,
  truck_id uuid not null references public.trucks (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (driver_id, truck_id)
);

alter table public.driver_trucks enable row level security;

drop policy if exists "Staff can view driver_trucks" on public.driver_trucks;
create policy "Staff can view driver_trucks"
  on public.driver_trucks
  for select
  using (public.is_active_staff());

drop policy if exists "Staff can insert driver_trucks" on public.driver_trucks;
create policy "Staff can insert driver_trucks"
  on public.driver_trucks
  for insert
  with check (public.is_active_staff());

drop policy if exists "Staff can delete driver_trucks" on public.driver_trucks;
create policy "Staff can delete driver_trucks"
  on public.driver_trucks
  for delete
  using (public.is_active_staff());
