-- Transaction numbers move to the 100000 series: GI-000001 becomes
-- GI-100001. The sequence keeps counting as before; the offset is applied
-- when formatting, so the next new transaction simply follows on from the
-- last one (GI-000006 -> GI-100007) with no sequence reset needed. Plain
-- concatenation rather than lpad, which would truncate past 6 digits.

create or replace function public.generate_transaction_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'GI-' || (100000 + nextval('public.transaction_number_seq'))::text;
$$;

-- Renumber existing transactions to match. Only the old zero-padded
-- GI-0xxxxx form is touched, so re-running this is harmless.
update public.transactions
set transaction_number =
  'GI-' || (100000 + substring(transaction_number from 4)::bigint)::text
where transaction_number ~ '^GI-0[0-9]{5}$';
