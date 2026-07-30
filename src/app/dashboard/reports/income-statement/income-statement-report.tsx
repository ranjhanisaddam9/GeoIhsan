"use client";

import { useState } from "react";
import { DatePresetFilter } from "../../_components/DatePresetFilter";
import { rangeForPreset, type DatePresetKey } from "../../_components/date-presets";
import { isWithinDateRange } from "../../_components/date-utils";
import { EXPENSE_CATEGORIES } from "../../expenses/expense-categories";

// Only the fields the statement actually sums, for non-voided transactions.
export type IncomeStatementTransaction = {
  transaction_date: string;
  commission_amount: number;
  commission_discount: number;
  commission_balance: number;
};

export type IncomeStatementExpense = {
  expense_date: string;
  category: string;
  amount: number;
};

const PRESETS: DatePresetKey[] = [
  "today",
  "yesterday",
  "week",
  "last_week",
  "month",
  "last_month",
  "year",
  "last_year",
  "custom",
];

function formatMoney(n: number) {
  return n.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Row({
  label,
  value,
  indent,
  muted,
}: {
  label: string;
  value: number;
  indent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 text-sm ${
        indent ? "ps-4" : ""
      } ${muted ? "text-zinc-600 dark:text-zinc-400" : "text-black dark:text-zinc-50"}`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{formatMoney(value)}</span>
    </div>
  );
}

function SubtotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-300 py-2 text-sm font-semibold text-black dark:border-zinc-700 dark:text-zinc-50">
      <span>{label}</span>
      <span className="tabular-nums">{formatMoney(value)}</span>
    </div>
  );
}

export function IncomeStatementReport({
  transactions,
  expenses,
}: {
  transactions: IncomeStatementTransaction[];
  expenses: IncomeStatementExpense[];
}) {
  const initial = rangeForPreset("month");
  const [preset, setPreset] = useState<DatePresetKey | null>("month");
  const [dateFrom, setDateFrom] = useState(initial?.from ?? "");
  const [dateTo, setDateTo] = useState(initial?.to ?? "");

  const periodTransactions = transactions.filter((t) =>
    isWithinDateRange(t.transaction_date, dateFrom, dateTo),
  );
  const periodExpenses = expenses.filter((e) =>
    isWithinDateRange(e.expense_date, dateFrom, dateTo),
  );

  const sum = (nums: number[]) => nums.reduce((total, n) => total + n, 0);

  const grossCommission = sum(periodTransactions.map((t) => t.commission_amount));
  const commissionDiscount = sum(periodTransactions.map((t) => t.commission_discount));
  const netCommission = grossCommission - commissionDiscount;
  const outstanding = sum(periodTransactions.map((t) => t.commission_balance));

  const expenseByCategory = EXPENSE_CATEGORIES.map((category) => ({
    category,
    total: sum(
      periodExpenses.filter((e) => e.category === category).map((e) => e.amount),
    ),
  })).filter((row) => row.total > 0);

  const totalExpenses = sum(periodExpenses.map((e) => e.amount));
  const netProfit = netCommission - totalExpenses;

  return (
    <div className="mt-6 flex flex-col gap-6">
      <DatePresetFilter
        presets={PRESETS}
        preset={preset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={(nextPreset, from, to) => {
          setPreset(nextPreset);
          setDateFrom(from);
          setDateTo(to);
        }}
      />

      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {dateFrom || dateTo
            ? `Period: ${dateFrom || "—"} to ${dateTo || "—"}`
            : "Period: all time"}
        </p>

        <h2 className="mt-6 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Income
        </h2>
        <Row label="Gross Commission" value={grossCommission} indent />
        <Row label="Less: Commission Discount" value={-commissionDiscount} indent muted />
        <SubtotalRow label="Net Commission Income" value={netCommission} />

        <h2 className="mt-6 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Expenses
        </h2>
        {expenseByCategory.length === 0 && (
          <p className="py-1.5 ps-4 text-sm text-zinc-500 dark:text-zinc-400">
            No expenses in this period.
          </p>
        )}
        {expenseByCategory.map((row) => (
          <Row key={row.category} label={row.category} value={row.total} indent />
        ))}
        <SubtotalRow label="Total Expenses" value={totalExpenses} />

        <div
          className={`mt-6 flex items-center justify-between border-t-2 border-zinc-900 pt-3 text-base font-bold dark:border-zinc-100 ${
            netProfit < 0
              ? "text-red-700 dark:text-red-400"
              : "text-green-700 dark:text-green-400"
          }`}
        >
          <span>{netProfit < 0 ? "Net Loss" : "Net Profit"}</span>
          <span className="tabular-nums">{formatMoney(netProfit)}</span>
        </div>

        {/* Not part of the profit calculation — commission that has been
            earned and counted as income above but not collected yet. */}
        <p className="mt-6 border-t border-dashed border-zinc-300 pt-3 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Memo — commission still outstanding for this period:{" "}
          <span className="font-medium tabular-nums">{formatMoney(outstanding)}</span>
        </p>
      </div>
    </div>
  );
}
