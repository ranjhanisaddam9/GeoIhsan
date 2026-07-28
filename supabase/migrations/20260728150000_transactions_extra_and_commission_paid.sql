-- Adds an "Extra" charge (folded into the fare total/balance alongside
-- weighing/labour/fare) and tracks commission paid separately from the fare
-- advance, with its own generated commission_balance — the fare side and
-- the commission side are settled independently.

alter table public.transactions add column extra_charges numeric not null default 0;

alter table public.transactions drop column total_fare_charges;
alter table public.transactions add column total_fare_charges numeric generated always as (
  weighing_bridge_cost + loading_labour_charges + fare_charges + extra_charges
) stored;

alter table public.transactions drop column remaining_fare;
alter table public.transactions add column remaining_fare numeric generated always as (
  (weighing_bridge_cost + loading_labour_charges + fare_charges + extra_charges) - advance_fare
) stored;

alter table public.transactions add column commission_paid numeric not null default 0;
alter table public.transactions add column commission_balance numeric generated always as (
  commission_amount - commission_paid
) stored;
