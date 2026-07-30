-- Day-to-day station expenses (fuel, tea, bills, etc.), listed on their own
-- page. Like the waitlists, entries are genuinely deleted rather than
-- soft-deleted — there's no historical record anything else references.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null check (
    category in (
      'Home', 'Tea', 'Petrol', 'Ice', 'Stationary',
      'Internet Bill', 'Mobile Recharge', 'Other'
    )
  ),
  amount numeric not null,
  comments text,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

drop policy if exists "Staff can view expenses" on public.expenses;
create policy "Staff can view expenses"
  on public.expenses for select using (public.is_active_staff());

drop policy if exists "Staff can insert expenses" on public.expenses;
create policy "Staff can insert expenses"
  on public.expenses for insert with check (public.is_active_staff());

drop policy if exists "Staff can update expenses" on public.expenses;
create policy "Staff can update expenses"
  on public.expenses for update
  using (public.is_active_staff()) with check (public.is_active_staff());

drop policy if exists "Staff can delete expenses" on public.expenses;
create policy "Staff can delete expenses"
  on public.expenses for delete using (public.is_active_staff());
