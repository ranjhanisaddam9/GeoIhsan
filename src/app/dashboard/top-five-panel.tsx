"use client";

import { useState } from "react";
import { inputClass } from "./_components/ui";
import { isWithinDateRange } from "./_components/date-utils";
import { labelFor, type Option } from "./waitlist-shared";

// One row per non-voided transaction, trimmed to just what the ranking
// needs. Aggregated client-side so switching date presets is instant.
export type TopFiveTransaction = {
  transaction_date: string;
  truck_id: string;
  driver_id: string;
  client_id: string;
};

type PresetKey = "this_month" | "last_month" | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "custom", label: "Custom Date" },
];

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function rangeForPreset(key: PresetKey): { from: string; to: string } | null {
  const today = new Date();
  if (key === "this_month") {
    return {
      from: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: toIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    };
  }
  if (key === "last_month") {
    return {
      from: toIsoDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      to: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 0)),
    };
  }
  // "custom" leaves the range to the date inputs below.
  return null;
}

// Highest transaction count first; ties fall back to name so the order is
// stable rather than dependent on row order.
function topFive(
  transactions: TopFiveTransaction[],
  pick: (t: TopFiveTransaction) => string,
  options: Option[],
) {
  const counts = new Map<string, number>();
  for (const t of transactions) {
    const id = pick(t);
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([id, count]) => ({ id, count, label: labelFor(options, id) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 5);
}

function TopFiveColumn({
  title,
  entries,
}: {
  title: string;
  entries: { id: string; count: number; label: string }[];
}) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="border-b border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {title}
      </div>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {entries.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No transactions in this period.
          </li>
        )}
        {entries.map((entry, index) => (
          <li key={entry.id} className="flex items-center gap-3 px-4 py-2 text-sm">
            <span className="w-4 shrink-0 text-zinc-400 dark:text-zinc-500">
              {index + 1}
            </span>
            <span className="flex-1 truncate text-black dark:text-zinc-50">
              {entry.label}
            </span>
            <span className="shrink-0 rounded-md border border-zinc-300 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopFivePanel({
  transactions,
  truckOptions,
  driverOptions,
  clientOptions,
}: {
  transactions: TopFiveTransaction[];
  truckOptions: Option[];
  driverOptions: Option[];
  clientOptions: Option[];
}) {
  const initial = rangeForPreset("this_month");
  const [preset, setPreset] = useState<PresetKey>("this_month");
  const [dateFrom, setDateFrom] = useState(initial?.from ?? "");
  const [dateTo, setDateTo] = useState(initial?.to ?? "");

  function selectPreset(key: PresetKey) {
    setPreset(key);
    const range = rangeForPreset(key);
    if (range) {
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  }

  const customEnabled = preset === "custom";
  const filtered = transactions.filter((t) =>
    isWithinDateRange(t.transaction_date, dateFrom, dateTo),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Top 5</h2>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => selectPreset(p.key)}
              className={
                preset === p.key
                  ? "rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white"
                  : "rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }
            >
              {p.label}
            </button>
          ))}
          <input
            type="date"
            value={dateFrom}
            disabled={!customEnabled}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">to</span>
          <input
            type="date"
            value={dateTo}
            disabled={!customEnabled}
            onChange={(e) => setDateTo(e.target.value)}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <TopFiveColumn
          title="Trucks"
          entries={topFive(filtered, (t) => t.truck_id, truckOptions)}
        />
        <TopFiveColumn
          title="Drivers"
          entries={topFive(filtered, (t) => t.driver_id, driverOptions)}
        />
        <TopFiveColumn
          title="Clients"
          entries={topFive(filtered, (t) => t.client_id, clientOptions)}
        />
      </div>
    </div>
  );
}
