import { createClient } from "@/lib/supabase/server";
import { ExpensesManager } from "./expenses-manager";

export default async function ExpensesPage() {
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, expense_date, category, amount, comments, created_at")
    .order("expense_date", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Expenses
      </h1>
      <ExpensesManager initialExpenses={expenses ?? []} />
    </div>
  );
}
