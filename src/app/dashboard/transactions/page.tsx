import { createClient } from "@/lib/supabase/server";
import { TRANSACTION_COLUMNS } from "./transaction-constants";
import { getTransactionFormReferenceData } from "./get-form-reference-data";
import { TransactionsManager, type TransactionRow } from "./transactions-manager";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const [{ data: transactions }, referenceData] = await Promise.all([
    supabase
      .from("transactions")
      .select(TRANSACTION_COLUMNS)
      .eq("is_voided", false)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    getTransactionFormReferenceData(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Transactions
      </h1>
      <TransactionsManager
        initialTransactions={(transactions ?? []) as unknown as TransactionRow[]}
        referenceData={referenceData}
      />
    </div>
  );
}
