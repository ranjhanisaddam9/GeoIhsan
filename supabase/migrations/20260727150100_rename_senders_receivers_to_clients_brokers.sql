-- Renames senders -> clients, receivers -> brokers, and
-- receiver_locations -> broker_locations (including its receiver_id
-- column -> broker_id), for databases where the original Phase 5
-- migration (senders/receivers naming) was already applied.
--
-- Safe to run as-is even if some of these were never created: each
-- statement is a no-op when its source name doesn't exist.

alter table if exists public.senders rename to clients;
alter table if exists public.receivers rename to brokers;
alter table if exists public.receiver_locations rename to broker_locations;
alter table if exists public.broker_locations rename column receiver_id to broker_id;
