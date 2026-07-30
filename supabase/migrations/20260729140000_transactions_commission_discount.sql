-- Commission Discount: when a driver pays part of the commission, the
-- unpaid remainder is written off as a discount and nothing stays
-- outstanding. Paying nothing at all is not a discount; the full amount
-- remains outstanding as the balance.
--
--   paid = 0  ->  discount = 0,               balance = commission_amount
--   paid > 0  ->  discount = amount - paid,   balance = 0
--
-- That rule is applied by the transaction form as the user fills the
-- fields — it is NOT enforced here. Both columns are plain stored values
-- so a user can override what the form suggests, and the DB saves
-- whatever was submitted. commission_balance was previously a generated
-- column, so it's dropped and re-added as a plain one.

alter table public.transactions drop column if exists commission_discount;
alter table public.transactions add column commission_discount numeric not null default 0;

alter table public.transactions drop column if exists commission_balance;
alter table public.transactions add column commission_balance numeric not null default 0;

-- Seed existing rows with what the form would have auto-filled. Balance is
-- amount - (paid + discount); with the discount above that reduces to the
-- full amount when nothing was paid, and to zero once anything was.
update public.transactions
set
  commission_discount = case
    when commission_paid > 0 then commission_amount - commission_paid
    else 0
  end,
  commission_balance = case
    when commission_paid > 0 then 0
    else commission_amount
  end;
