"use client";

import { isWithinDateRange } from "./_components/date-utils";
import { labelFor, type Option } from "./waitlist-shared";

// One row per non-voided transaction, trimmed to just what the ranking
// needs. Aggregated client-side so switching the dashboard's date filter is
// instant.
export type TopFiveTransaction = {
  transaction_date: string;
  truck_id: string;
  driver_id: string;
  client_id: string;
};

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

// The date range comes from the dashboard's period filter at the top.
export function TopFivePanel({
  transactions,
  dateFrom,
  dateTo,
  truckOptions,
  driverOptions,
  clientOptions,
}: {
  transactions: TopFiveTransaction[];
  dateFrom: string;
  dateTo: string;
  truckOptions: Option[];
  driverOptions: Option[];
  clientOptions: Option[];
}) {
  const filtered = transactions.filter((t) =>
    isWithinDateRange(t.transaction_date, dateFrom, dateTo),
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">Top 5</h2>

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
