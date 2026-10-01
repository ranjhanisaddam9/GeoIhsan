-- Transaction numbers move from zero-padded GI-000001 to unpadded numbers
-- starting at GI-10000. Existing numbers shift by the same offset
-- (GI-000001 -> GI-10000, GI-000002 -> GI-10001, ...) so their order is kept,
-- and the sequence continues straight after the highest one.

create or replace function public.generate_transaction_number()
returns text
language sql
security definer
set search_path = public
as $$
  select 'GI-' || nextval('public.transaction_number_seq')::text;
$$;

update public.transactions
set transaction_number = 'GI-' || (substring(transaction_number from 4)::bigint + 9999)::text
where transaction_number ~ '^GI-[0-9]{6}$';

-- Next number is one past the highest in use, or 10000 when there are none.
select setval(
  'public.transaction_number_seq',
  coalesce(
    (
      select max(substring(transaction_number from 4)::bigint)
      from public.transactions
      where transaction_number ~ '^GI-[0-9]+$'
    ),
    9999
  ),
  true
);
