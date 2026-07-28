-- One-time cleanup requested to clear out all existing commission rate
-- test data. New rates get created automatically going forward, either
-- manually on the Commission page or auto-inserted when a transaction is
-- saved on a route with no existing rate.
delete from public.commission_rates;
