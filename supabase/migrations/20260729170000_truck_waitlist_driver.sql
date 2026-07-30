-- truck_waitlist originally shipped with a client_id reference; it was
-- changed to driver_id before anyone used it. Databases that already ran
-- the first version still have the old column, and the "create table if
-- not exists" in that migration won't correct them — so do it here.
--
-- Idempotent either way: on a database created from the corrected
-- migration both statements are no-ops.

alter table public.truck_waitlist drop column if exists client_id;

alter table public.truck_waitlist
  add column if not exists driver_id uuid references public.drivers(id);
