-- Who recorded the commission payment. Stamped with the signed-in user on
-- every transaction save — both from the full transaction form and from the
-- dashboard's Pending Commission popup.

alter table public.transactions
  add column if not exists commission_received_by uuid references public.profiles(id);
