-- Drivers and trucks are independent records with no persistent
-- association between them. A transaction still records its own specific
-- truck_id and driver_id independently (which truck+driver combo handled
-- that shipment) — that direct relationship on transactions is unaffected
-- by this and stays as-is.

drop table if exists public.driver_trucks;
