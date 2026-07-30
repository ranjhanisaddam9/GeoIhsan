// Shared bits between the Client and Truck waitlist grids on the dashboard.
// Plain module (no "use client") so the dashboard server component can import
// the column lists too.

export type Option = { id: string; label: string; displayLabel?: string };

export const CLIENT_WAITLIST_COLUMNS =
  "id, entry_date, from_city_id, to_city_id, truck_qty, load_date, " +
  "client_id, priority, comments";

export const TRUCK_WAITLIST_COLUMNS =
  "id, entry_date, from_city_id, to_city_id, truck_id, load_date, " +
  "driver_id, priority, comments";

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function toIntOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : Math.trunc(n);
}

export function labelFor(options: Option[], id: string | null) {
  if (!id) return "—";
  const option = options.find((o) => o.id === id);
  return option?.displayLabel ?? option?.label ?? "—";
}

// Newest first, then most urgent first within a day. Entries with no
// priority set sort after those that have one.
export function sortWaitlist<T extends { entry_date: string; priority: number | null }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const byDate = b.entry_date.localeCompare(a.entry_date);
    if (byDate !== 0) return byDate;
    if (a.priority === b.priority) return 0;
    if (a.priority === null) return 1;
    if (b.priority === null) return -1;
    return a.priority - b.priority;
  });
}
