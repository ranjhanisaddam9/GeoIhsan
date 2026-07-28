-- "From Location" is replaced by "From City" — origin is now picked at
-- city granularity (matching how commission_rates already keys off
-- from_city_id/to_city_id), while "To Location" stays a specific location.

alter table public.transactions add column from_city_id uuid references public.cities (id);

update public.transactions t
set from_city_id = l.city_id
from public.locations l
where t.from_location_id = l.id;

alter table public.transactions alter column from_city_id set not null;
alter table public.transactions drop column from_location_id;

create index if not exists transactions_from_city_id_idx
  on public.transactions (from_city_id);
