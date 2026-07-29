-- Adds free-text detail fields requested for Drivers and Trucks.

alter table public.drivers add column if not exists care_of_details text;
alter table public.trucks add column if not exists owner_details text;
