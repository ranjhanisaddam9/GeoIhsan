-- Adds real username-based login. Supabase Auth itself stays email-based
-- (that's how auth.users works), so the login page resolves username ->
-- email via a public RPC function *before* calling signInWithPassword.

alter table public.profiles add column if not exists username text;

-- Case-insensitive uniqueness (no citext extension needed).
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- Finds a free username from a base string: "saddam", then "saddam2",
-- "saddam3", ... Used both to backfill existing accounts below and by the
-- new-user trigger going forward, so nobody ends up without a username.
create or replace function public.generate_unique_username(base text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned text := regexp_replace(lower(coalesce(base, '')), '[^a-z0-9._-]', '', 'g');
  candidate text;
  suffix int := 1;
begin
  if cleaned = '' then
    cleaned := 'user';
  end if;
  candidate := cleaned;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    suffix := suffix + 1;
    candidate := cleaned || suffix::text;
  end loop;
  return candidate;
end;
$$;

-- Backfill every existing profile from its auth.users email's local part,
-- so nobody is locked out once the login page switches to username-only.
update public.profiles p
set username = public.generate_unique_username(split_part(u.email, '@', 1))
from auth.users u
where p.id = u.id and p.username is null;

alter table public.profiles alter column username set not null;

-- New signups now also get a default username (same derivation), so the
-- trigger never leaves a profile without one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    null,
    public.generate_unique_username(split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Public, unauthenticated-safe lookup: username -> email. Returns only the
-- bare email string (never any other profile/auth data), and returns NULL
-- rather than raising when not found — the login page shows the same
-- generic "Invalid login credentials" error either way, so a wrong
-- username can't be distinguished from a wrong password.
create or replace function public.email_for_username(p_username text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username)
  limit 1;
$$;

revoke all on function public.email_for_username(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;
