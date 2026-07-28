-- Saving a transaction on a route with no existing commission rate now
-- auto-creates one (see Transaction form). Since any active staff member
-- (not just admins) can create transactions, the insert policy must allow
-- them too, or that auto-create silently fails via RLS for non-admins.
drop policy if exists "Admins can insert commission_rates" on public.commission_rates;
create policy "Staff can insert commission_rates"
  on public.commission_rates for insert with check (public.is_active_staff());
