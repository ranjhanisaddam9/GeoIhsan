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
  "commission_amount, commission_paid, commission_discount, commission_balance, " +
  "commission_received_by";

export type PendingCommissionRow = {
  id: string;
  transaction_number: string;
  transaction_date: string;
  driver_id: string;
  truck_id: string;
  commission_amount: number;
  commission_paid: number;
  commission_discount: number;
  commission_balance: number;
  commission_received_by: string | null;
};

// Newest first, then the largest outstanding balance within a day.
function sortPending(rows: PendingCommissionRow[]) {
  return [...rows].sort(
    (a, b) =>
      b.transaction_date.localeCompare(a.transaction_date) ||
      b.commission_balance - a.commission_balance,
  );
}

export function PendingCommissionList({
  initialRows,
  driverOptions,
  truckOptions,
  userOptions,
}: {
  initialRows: PendingCommissionRow[];
  driverOptions: Option[];
  truckOptions: Option[];
  userOptions: Option[];
}) {
  const [rows, setRows] = useState<PendingCommissionRow[]>(sortPending(initialRows));
  const [active, setActive] = useState<PendingCommissionRow | null>(null);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  function openSettle(row: PendingCommissionRow) {
    // Settling in full is the common case, so start there.
    setReceiveAmount(formatMoney(row.commission_balance));
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

    const due = active.commission_balance;
    const received = toNumber(receiveAmount);

    if (received < 0) {
      setFormError("Receive Amount cannot be negative.");
      return;
    }
    if (received > due) {
      setFormError(`Receive Amount cannot exceed the due balance of ${formatMoney(due)}.`);
      return;
    }

    // Anything short of the full due balance is written off, so the
    // transaction always comes out fully settled.
    const shortfall = due - received;
    const nextPaid = active.commission_paid + received;
    const nextDiscount = active.commission_discount + shortfall;

    setFormLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("transactions")
      .update({
        commission_paid: nextPaid,
        commission_discount: nextDiscount,
        commission_balance: active.commission_amount - (nextPaid + nextDiscount),
        commission_received_by: user?.id ?? null,
      })
      .eq("id", active.id)
      .select(PENDING_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    const saved = data as unknown as PendingCommissionRow;
    // Once nothing is outstanding the transaction drops off this list.
    setRows((prev) =>
      saved.commission_balance > 0
        ? sortPending(prev.map((r) => (r.id === saved.id ? saved : r)))
        : prev.filter((r) => r.id !== saved.id),
    );
    closeModal();
  }

  const due = active?.commission_balance ?? 0;
  const shortfall = Math.max(due - toNumber(receiveAmount), 0);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
        Pending Commission
      </h2>

      <Modal
        open={active !== null}
        onClose={closeModal}
        title={active ? `Commission — ${active.transaction_number}` : ""}
      >
        {active && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Due Balance
                </label>
                <div
                  className={`${inputClass} bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300`}
                >
                  {formatMoney(due)}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Receive Amount
                </label>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(normalizeNumeric(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            {shortfall > 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {formatMoney(shortfall)} will be written off as a discount.
              </p>
            )}

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
              <th className="px-4 py-2 font-medium">Balance Due</th>
              <th className="px-4 py-2 font-medium">Received by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No commission outstanding.
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => openSettle(row)}
                    aria-label="Settle commission"
                    title="Settle commission"
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
                  {formatMoney(row.commission_balance)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {labelFor(userOptions, row.commission_received_by)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
