-- Phase 6: app_settings for admin-controlled system-wide defaults.
--
-- Commission itself is NOT stored here — it varies per transaction and will
-- live as a "commission_amount" column directly on the transactions table
-- in the next phase (never printed on the customer receipt). This table
-- only holds the *default* value used to pre-fill that per-transaction
-- field; admins can still override the amount on each transaction.

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- Both admin and manager can read settings (managers need the default
-- commission value even though they can't change it).
drop policy if exists "Staff can view app_settings" on public.app_settings;
create policy "Staff can view app_settings"
  on public.app_settings for select using (public.is_active_staff());

-- Only admins can change settings.
drop policy if exists "Admins can update app_settings" on public.app_settings;
create policy "Admins can update app_settings"
  on public.app_settings for update
  using (public.is_admin()) with check (public.is_admin());

-- No insert/delete policy: this table's rows are seeded via migration, not
-- managed through the app UI in this phase.

insert into public.app_settings (key, value)
values ('default_commission_amount', '0')
on conflict (key) do nothing;
