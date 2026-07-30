"use client";

import { useState } from "react";
import { rangeForPreset, type DatePresetKey } from "./_components/date-presets";
import { isWithinDateRange } from "./_components/date-utils";

// Same figures the Income Statement report shows, summarised per period.
export type SummaryTransaction = {
  transaction_date: string;
  commission_amount: number;
  commission_discount: number;
};

export type SummaryExpense = {
  expense_date: string;
  amount: number;
};

const TABS: { key: DatePresetKey; label: string }[] = [
  { key: "month", label: "Current Month" },
  { key: "last_month", label: "Last Month" },
  { key: "year", label: "This Year" },
  { key: "last_year", label: "Last Year" },
];

function formatMoney(n: number) {
  return n.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Card({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "profit";
}) {
  const valueClass =
    tone === "profit"
      ? value < 0
        ? "text-red-700 dark:text-red-400"
        : "text-green-700 dark:text-green-400"
      : "text-black dark:text-zinc-50";

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueClass}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

export function PeriodSummaryTabs({
  transactions,
  expenses,
}: {
  transactions: SummaryTransaction[];
  expenses: SummaryExpense[];
}) {
  const [tab, setTab] = useState<DatePresetKey>("month");

  const range = rangeForPreset(tab);
  const from = range?.from ?? "";
  const to = range?.to ?? "";

  const sum = (nums: number[]) => nums.reduce((total, n) => total + n, 0);

  const periodTransactions = transactions.filter((t) =>
    isWithinDateRange(t.transaction_date, from, to),
  );
  const netIncome = sum(
    periodTransactions.map((t) => t.commission_amount - t.commission_discount),
  );
  const netExpenses = sum(
    expenses
      .filter((e) => isWithinDateRange(e.expense_date, from, to))
      .map((e) => e.amount),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "-mb-px border-b-2 border-green-600 px-3 py-2 text-sm font-semibold text-green-700 dark:text-green-400"
                : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Net Income" value={netIncome} />
        <Card label="Net Expenses" value={netExpenses} />
        <Card label="Net Profit" value={netIncome - netExpenses} tone="profit" />
      </div>
    </div>
  );
}
