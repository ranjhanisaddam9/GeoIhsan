-- "To" becomes a City field (mirroring "From"), matching commission_rates'
-- own from_city_id/to_city_id granularity. The old "To Location" field is
-- kept, but repurposed as the optional "C/o" location — no longer the sole
-- determinant of the route's destination city, so it's no longer required.

alter table public.transactions add column to_city_id uuid references public.cities (id);

update public.transactions t
set to_city_id = l.city_id
from public.locations l
where t.to_location_id = l.id;

alter table public.transactions alter column to_city_id set not null;
alter table public.transactions alter column to_location_id drop not null;

create index if not exists transactions_to_city_id_idx
  on public.transactions (to_city_id);
