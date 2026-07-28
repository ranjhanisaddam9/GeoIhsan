-- Commission rates were previously never deletable (only expired via
-- is_active = false) since transactions might reference them later. The
-- app now allows admins to delete a rate, but only after checking in the
-- UI that no transaction exists for that rate's route — this policy just
-- grants the DB-level permission; the association check itself happens
-- app-side (transactions have no direct foreign key to commission_rates).
drop policy if exists "Admins can delete commission_rates" on public.commission_rates;
create policy "Admins can delete commission_rates"
  on public.commission_rates for delete using (public.is_admin());
