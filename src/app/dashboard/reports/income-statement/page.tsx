import { createClient } from "@/lib/supabase/server";
import {
  IncomeStatementReport,
  type IncomeStatementExpense,
  type IncomeStatementTransaction,
} from "./income-statement-report";

export default async function IncomeStatementPage() {
  const supabase = await createClient();

  const [{ data: transactions }, { data: expenses }] = await Promise.all([
    supabase
      .from("transactions")
      .select("transaction_date, commission_amount, commission_discount, commission_balance")
      .eq("is_voided", false),
    supabase.from("expenses").select("expense_date, category, amount"),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Profit &amp; Loss
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Income Statement
      </p>
      <IncomeStatementReport
        transactions={(transactions ?? []) as unknown as IncomeStatementTransaction[]}
        expenses={(expenses ?? []) as unknown as IncomeStatementExpense[]}
      />
    </div>
  );
}
