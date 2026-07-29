-- Receipt language preference, admin-configurable from the Settings page.
-- Reuses the existing app_settings key/value table and RLS policies
-- (staff can read, admins can update).

insert into public.app_settings (key, value)
values ('receipt_language', 'english')
on conflict (key) do nothing;
