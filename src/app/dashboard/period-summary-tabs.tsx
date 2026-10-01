"use client";

import { useState } from "react";
import { Modal } from "./_components/Modal";
import { rangeForPreset, type DatePresetKey } from "./_components/date-presets";
import { isWithinDateRange } from "./_components/date-utils";
import { inputClass } from "./_components/ui";
import { TopFivePanel, type TopFiveTransaction } from "./top-five-panel";
import type { Option } from "./waitlist-shared";

// Same figures the Income Statement report shows, summarised per period.
export type SummaryTransaction = {
  transaction_date: string;
  commission_amount: number;
  commission_discount: number;
};

export type SummaryExpense = {
  expense_date: string;
  category: string;
  amount: number;
};

const TABS: { key: DatePresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "month", label: "Current Month" },
  { key: "last_month", label: "Last Month" },
  { key: "year", label: "This Year" },
  { key: "last_year", label: "Last Year" },
  { key: "custom", label: "Custom Date" },
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
  onClick,
}: {
  label: string;
  value: number;
  tone?: "neutral" | "profit";
  onClick?: () => void;
}) {
  const valueClass =
    tone === "profit"
      ? value < 0
        ? "text-red-700 dark:text-red-400"
        : "text-green-700 dark:text-green-400"
      : "text-black dark:text-zinc-50";

  const body = (
    <>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${valueClass}`}>
        {formatMoney(value)}
      </p>
    </>
  );

  const boxClass = "rounded-lg border border-zinc-200 p-4 dark:border-zinc-800";

  if (!onClick) return <div className={boxClass}>{body}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${boxClass} cursor-pointer text-left transition-colors hover:border-green-600 hover:bg-zinc-50 dark:hover:border-green-500 dark:hover:bg-zinc-900`}
    >
      {body}
    </button>
  );
}

// The dashboard's single date filter: drives the summary cards and the Top 5
// panel below them.
export function PeriodSummaryTabs({
  transactions,
  expenses,
  topFiveTransactions,
  truckOptions,
  driverOptions,
  clientOptions,
}: {
  transactions: SummaryTransaction[];
  expenses: SummaryExpense[];
  topFiveTransactions: TopFiveTransaction[];
  truckOptions: Option[];
  driverOptions: Option[];
  clientOptions: Option[];
}) {
  const initial = rangeForPreset("month");
  const [tab, setTab] = useState<DatePresetKey>("month");
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [expensesOpen, setExpensesOpen] = useState(false);

  // "custom" keeps the current range and unlocks the date inputs.
  function selectTab(key: DatePresetKey) {
    setTab(key);
    const range = rangeForPreset(key);
    if (range) {
      setFrom(range.from);
      setTo(range.to);
    }
  }

  const sum = (nums: number[]) => nums.reduce((total, n) => total + n, 0);

  const periodTransactions = transactions.filter((t) =>
    isWithinDateRange(t.transaction_date, from, to),
  );
  const netIncome = sum(
    periodTransactions.map((t) => t.commission_amount - t.commission_discount),
  );

  const periodExpenses = expenses.filter((e) =>
    isWithinDateRange(e.expense_date, from, to),
  );
  const netExpenses = sum(periodExpenses.map((e) => e.amount));

  // One row per expense type, biggest spend first — the drill-down answers
  // "where did the money go", not "what happened when".
  const expenseTotals = Object.entries(
    periodExpenses.reduce<Record<string, number>>((totals, e) => {
      totals[e.category] = (totals[e.category] ?? 0) + e.amount;
      return totals;
    }, {}),
  )
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const tabLabel =
    tab === "custom"
      ? `${from || "…"} to ${to || "…"}`
      : (TABS.find((t) => t.key === tab)?.label ?? "");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTab(t.key)}
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

      {tab === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={inputClass}
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Net Income" value={netIncome} />
        <Card
          label="Net Expenses"
          value={netExpenses}
          onClick={() => setExpensesOpen(true)}
        />
        <Card label="Net Profit" value={netIncome - netExpenses} tone="profit" />
      </div>

      <Modal
        open={expensesOpen}
        onClose={() => setExpensesOpen(false)}
        title={`Expenses — ${tabLabel}`}
      >
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">Expense</th>
                <th className="px-4 py-2 text-end font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {expenseTotals.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No expenses in this period.
                  </td>
                </tr>
              )}

              {expenseTotals.map((row) => (
                <tr key={row.category}>
                  <td className="px-4 py-2 text-black dark:text-zinc-50">
                    {row.category}
                  </td>
                  <td className="px-4 py-2 text-end tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatMoney(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            {expenseTotals.length > 0 && (
              <tfoot className="border-t border-zinc-300 dark:border-zinc-700">
                <tr className="font-semibold text-black dark:text-zinc-50">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-end tabular-nums">
                    {formatMoney(netExpenses)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Modal>

      <div className="mt-6">
        <TopFivePanel
          transactions={topFiveTransactions}
          dateFrom={from}
          dateTo={to}
          truckOptions={truckOptions}
          driverOptions={driverOptions}
          clientOptions={clientOptions}
        />
      </div>
    </div>
  );
}
