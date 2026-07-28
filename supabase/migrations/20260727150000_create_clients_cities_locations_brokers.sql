-- Phase 5: clients, cities, locations, brokers, and broker_locations join
-- table. Same staff-only RLS pattern as trucks/drivers (see
-- is_active_staff() from the trucks migration).

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  whatsapp text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

drop policy if exists "Staff can view clients" on public.clients;
create policy "Staff can view clients"
  on public.clients for select using (public.is_active_staff());

drop policy if exists "Staff can insert clients" on public.clients;
create policy "Staff can insert clients"
  on public.clients for insert with check (public.is_active_staff());

drop policy if exists "Staff can update clients" on public.clients;
create policy "Staff can update clients"
  on public.clients for update
  using (public.is_active_staff()) with check (public.is_active_staff());

-- No delete policy: clients are deactivated, never deleted.

-- ---------------------------------------------------------------------------
-- Cities
-- ---------------------------------------------------------------------------
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.cities enable row level security;

drop policy if exists "Staff can view cities" on public.cities;
create policy "Staff can view cities"
  on public.cities for select using (public.is_active_staff());

drop policy if exists "Staff can insert cities" on public.cities;
create policy "Staff can insert cities"
  on public.cities for insert with check (public.is_active_staff());

drop policy if exists "Staff can update cities" on public.cities;
create policy "Staff can update cities"
  on public.cities for update
  using (public.is_active_staff()) with check (public.is_active_staff());

-- No delete policy: cities are deactivated, never deleted.

-- ---------------------------------------------------------------------------
-- Locations (each belongs to exactly one city)
-- ---------------------------------------------------------------------------
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city_id uuid not null references public.cities (id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;

drop policy if exists "Staff can view locations" on public.locations;
create policy "Staff can view locations"
  on public.locations for select using (public.is_active_staff());

drop policy if exists "Staff can insert locations" on public.locations;
create policy "Staff can insert locations"
  on public.locations for insert with check (public.is_active_staff());

drop policy if exists "Staff can update locations" on public.locations;
create policy "Staff can update locations"
  on public.locations for update
  using (public.is_active_staff()) with check (public.is_active_staff());

-- No delete policy: locations are deactivated, never deleted.

-- ---------------------------------------------------------------------------
-- Brokers
-- ---------------------------------------------------------------------------
create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  whatsapp text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.brokers enable row level security;

drop policy if exists "Staff can view brokers" on public.brokers;
create policy "Staff can view brokers"
  on public.brokers for select using (public.is_active_staff());

drop policy if exists "Staff can insert brokers" on public.brokers;
create policy "Staff can insert brokers"
  on public.brokers for insert with check (public.is_active_staff());

drop policy if exists "Staff can update brokers" on public.brokers;
create policy "Staff can update brokers"
  on public.brokers for update
  using (public.is_active_staff()) with check (public.is_active_staff());

-- No delete policy: brokers are deactivated, never deleted.

-- ---------------------------------------------------------------------------
-- broker_locations: many-to-many association between brokers and
-- locations. Like driver_trucks, these link rows aren't historical records,
-- so they can be freely deleted when an association is removed.
-- ---------------------------------------------------------------------------
create table if not exists public.broker_locations (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (broker_id, location_id)
);

alter table public.broker_locations enable row level security;

drop policy if exists "Staff can view broker_locations" on public.broker_locations;
create policy "Staff can view broker_locations"
  on public.broker_locations for select using (public.is_active_staff());

drop policy if exists "Staff can insert broker_locations" on public.broker_locations;
create policy "Staff can insert broker_locations"
  on public.broker_locations for insert with check (public.is_active_staff());

drop policy if exists "Staff can delete broker_locations" on public.broker_locations;
create policy "Staff can delete broker_locations"
  on public.broker_locations for delete using (public.is_active_staff());
