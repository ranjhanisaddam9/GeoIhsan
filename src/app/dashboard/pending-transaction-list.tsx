"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "./_components/ui";
import { Modal } from "./_components/Modal";
import { CheckIcon, XMarkIcon } from "./_components/icons";
import { formatMoney, normalizeNumeric, toNumber } from "./transactions/commission-calc";
import { labelFor, type Option } from "./waitlist-shared";

const PENDING_COLUMNS =
  "id, transaction_number, transaction_date, driver_id, truck_id, " +
  "total_fare_charges, advance_fare, remaining_fare";

export type PendingTransactionRow = {
  id: string;
  transaction_number: string;
  transaction_date: string;
  driver_id: string;
  truck_id: string;
  total_fare_charges: number;
  advance_fare: number;
  remaining_fare: number;
};

// Newest first, then the largest outstanding balance within a day.
function sortPending(rows: PendingTransactionRow[]) {
  return [...rows].sort(
    (a, b) =>
      b.transaction_date.localeCompare(a.transaction_date) ||
      b.remaining_fare - a.remaining_fare,
  );
}

const readOnlyClass = `${inputClass} bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300`;

export function PendingTransactionList({
  initialRows,
  driverOptions,
  truckOptions,
}: {
  initialRows: PendingTransactionRow[];
  driverOptions: Option[];
  truckOptions: Option[];
}) {
  const [rows, setRows] = useState<PendingTransactionRow[]>(sortPending(initialRows));
  const [active, setActive] = useState<PendingTransactionRow | null>(null);
  const [adjustment, setAdjustment] = useState("0.00");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  function openSettle(row: PendingTransactionRow) {
    setAdjustment("0.00");
    setFormError(null);
    setActive(row);
  }

  function closeModal() {
    setActive(null);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    setFormError(null);

    const balance = active.remaining_fare;
    const amount = toNumber(adjustment);

    if (amount < 0) {
      setFormError("Balance Adjustment cannot be negative.");
      return;
    }
    if (amount > balance + 0.005) {
      setFormError(`Balance Adjustment cannot exceed the balance of ${formatMoney(balance)}.`);
      return;
    }

    // The adjustment is folded into Advance Paid (the receipt's "Amount
    // Received"); remaining_fare is a generated column and follows on its own.
    setFormLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("transactions")
      .update({
        advance_fare: Math.round((active.advance_fare + amount) * 100) / 100,
      })
      .eq("id", active.id)
      .select(PENDING_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    const saved = data as unknown as PendingTransactionRow;
    // Once nothing is outstanding the transaction drops off this list.
    setRows((prev) =>
      saved.remaining_fare > 0
        ? sortPending(prev.map((r) => (r.id === saved.id ? saved : r)))
        : prev.filter((r) => r.id !== saved.id),
    );
    closeModal();
  }

  const balance = active?.remaining_fare ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
        Pending Transaction
      </h2>

      <Modal
        open={active !== null}
        onClose={closeModal}
        title={active ? `Transaction — ${active.transaction_number}` : ""}
      >
        {active && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Total Amount
                </label>
                <div className={readOnlyClass}>{formatMoney(active.total_fare_charges)}</div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Advance Paid
                </label>
                <div className={readOnlyClass}>{formatMoney(active.advance_fare)}</div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Balance
                </label>
                <div className={readOnlyClass}>{formatMoney(balance)}</div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Balance Adjustment
                </label>
                <input
                  inputMode="decimal"
                  value={adjustment}
                  onFocus={(e) => {
                    if (toNumber(adjustment) === 0 && balance > 0) {
                      setAdjustment(balance.toFixed(2));
                      requestAnimationFrame(() => e.target.select());
                    }
                  }}
                  onChange={(e) => setAdjustment(normalizeNumeric(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={formLoading} className={primaryButtonClass}>
                <CheckIcon />
                {formLoading ? "Saving..." : "Update"}
              </button>
              <button type="button" onClick={closeModal} className={secondaryButtonClass}>
                <XMarkIcon />
                Cancel
              </button>
            </div>
            {formError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {formError}
              </p>
            )}
          </form>
        )}
      </Modal>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Actions</th>
              <th className="px-4 py-2 font-medium">TID</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Driver</th>
              <th className="px-4 py-2 font-medium">Truck#</th>
              <th className="px-4 py-2 font-medium">Total Amount</th>
              <th className="px-4 py-2 font-medium">Advance Paid</th>
              <th className="px-4 py-2 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No transaction balance outstanding.
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => openSettle(row)}
                    aria-label="Settle transaction"
                    title="Settle transaction"
                    className={secondaryButtonClass}
                  >
                    <CheckIcon />
                  </button>
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {row.transaction_number}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {row.transaction_date}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {labelFor(driverOptions, row.driver_id)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {labelFor(truckOptions, row.truck_id)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatMoney(row.total_fare_charges)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatMoney(row.advance_fare)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatMoney(row.remaining_fare)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
