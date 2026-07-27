-- Phase 2: profiles table, auto-provisioning trigger, and role-based RLS.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  -- 'role' is nullable on purpose: a brand-new user has no role until an
  -- admin assigns one manually (see trigger below and Phase 2 setup notes).
  -- A NULL value always satisfies a CHECK constraint in Postgres, so this
  -- constraint still enforces 'admin' | 'manager' once a role IS set.
  role text check (role in ('admin', 'manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new user signs up in auth.users.
-- Role is left NULL ("pending") until an admin sets it. security definer is
-- required here because the inserting "user" (the trigger, run as the table
-- owner) would otherwise be blocked by the RLS insert policy below, which
-- only allows admins to insert.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', null);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Helper used by policies below. security definer + a fixed search_path lets
-- it read public.profiles bypassing RLS, which avoids the infinite
-- recursion you'd get from a policy on "profiles" querying "profiles"
-- directly through the normal (RLS-checked) path.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Any authenticated user can read their own profile.
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Only admins can read every profile (needed for Manager Management, Phase 3).
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (public.is_admin());

-- Only admins can insert profiles directly (the signup trigger bypasses this
-- via security definer, so this only governs admin-driven creation later).
drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles"
  on public.profiles
  for insert
  with check (public.is_admin());

-- Only admins can update profiles (e.g. assigning roles, deactivating users).
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- Only admins can delete profiles.
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles
  for delete
  using (public.is_admin());
