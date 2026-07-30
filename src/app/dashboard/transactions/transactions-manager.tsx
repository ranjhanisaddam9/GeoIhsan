"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../_components/ui";
import { DateRangeFilter } from "../_components/DateRangeFilter";
import { Modal } from "../_components/Modal";
import { isWithinDateRange } from "../_components/date-utils";
import { PlusIcon, PencilIcon, EyeIcon, TrashIcon, PrinterIcon } from "../_components/icons";
import { TransactionForm, type TransactionFormValues } from "./transaction-form";
import { TRANSACTION_COLUMNS } from "./transaction-constants";
import type { SimpleOption, TransactionFormReferenceData } from "./get-form-reference-data";

export type TransactionRow = {
  id: string;
  transaction_number: string;
  transaction_date: string;
  from_city_id: string;
  to_city_id: string;
  to_location_id: string | null;
  truck_id: string;
  driver_id: string;
  client_id: string;
  broker_id: string;
  item_name: string;
  quantity: number | null;
  weight: number | null;
  weighing_bridge_cost: number;
  loading_labour_charges: number;
  fare_charges: number;
  extra_charges: number;
  total_fare_charges: number;
  advance_fare: number;
  remaining_fare: number;
  commission_amount: number;
  commission_paid: number;
  commission_balance: number;
  commission_discount: number;
  commission_received_by: string | null;
  is_voided: boolean;
  void_reason: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type ModalState =
  | { mode: "add" }
  | { mode: "edit" | "details" | "delete"; transaction: TransactionRow };

function labelFor(options: SimpleOption[], id: string) {
  const option = options.find((o) => o.id === id);
  return option?.displayLabel ?? option?.label ?? "—";
}

function valuesFromTransaction(t: TransactionRow): TransactionFormValues {
  return {
    transaction_date: t.transaction_date,
    from_city_id: t.from_city_id,
    to_city_id: t.to_city_id,
    to_location_id: t.to_location_id ?? "",
    truck_id: t.truck_id,
    driver_id: t.driver_id,
    client_id: t.client_id,
    broker_id: t.broker_id,
    item_name: t.item_name,
    quantity: t.quantity !== null ? String(t.quantity) : "",
    weight: t.weight !== null ? String(t.weight) : "",
    weighing_bridge_cost: String(t.weighing_bridge_cost),
    loading_labour_charges: String(t.loading_labour_charges),
    fare_charges: String(t.fare_charges),
    extra_charges: String(t.extra_charges),
    advance_fare: String(t.advance_fare),
    commission_amount: String(t.commission_amount),
    commission_paid: String(t.commission_paid),
    commission_discount: String(t.commission_discount),
    commission_balance: String(t.commission_balance),
  };
}

function sortByDateDesc(rows: TransactionRow[]) {
  return [...rows].sort((a, b) => {
    const dateCompare = b.transaction_date.localeCompare(a.transaction_date);
    if (dateCompare !== 0) return dateCompare;
    return b.created_at.localeCompare(a.created_at);
  });
}

export function TransactionsManager({
  initialTransactions,
  referenceData,
}: {
  initialTransactions: TransactionRow[];
  referenceData: TransactionFormReferenceData;
}) {
  const [transactions, setTransactions] = useState<TransactionRow[]>(
    sortByDateDesc(initialTransactions),
  );
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);

  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState<string | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);

  const query = search.trim().toLowerCase();
  const filteredTransactions = transactions.filter((t) => {
    if (!isWithinDateRange(t.transaction_date, dateFrom, dateTo)) return false;
    const truckLabel = labelFor(referenceData.allTrucks, t.truck_id);
    const toCityLabel = labelFor(referenceData.cities, t.to_city_id);
    const brokerLabel = labelFor(referenceData.allBrokers, t.broker_id);
    return (
      t.transaction_number.toLowerCase().includes(query) ||
      truckLabel.toLowerCase().includes(query) ||
      toCityLabel.toLowerCase().includes(query) ||
      brokerLabel.toLowerCase().includes(query)
    );
  });

  function openAdd() {
    setModal({ mode: "add" });
  }

  function openEdit(transaction: TransactionRow) {
    setModal({ mode: "edit", transaction });
  }

  function openDetails(transaction: TransactionRow) {
    setModal({ mode: "details", transaction });
  }

  function openDelete(transaction: TransactionRow) {
    setVoidReason("");
    setVoidError(null);
    setModal({ mode: "delete", transaction });
  }

  function closeModal() {
    setModal(null);
    setVoidError(null);
  }

  function handleSaved(savedId: string, isCreate: boolean) {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("transactions")
        .select(TRANSACTION_COLUMNS)
        .eq("id", savedId)
        .single();

      if (data) {
        const row = data as unknown as TransactionRow;
        setTransactions((prev) =>
          isCreate
            ? sortByDateDesc([...prev, row])
            : sortByDateDesc(prev.map((t) => (t.id === row.id ? row : t))),
        );
      }
      closeModal();
    })();
  }

  async function handleDelete() {
    if (!modal || modal.mode !== "delete") return;
    setVoidError(null);

    if (!voidReason.trim()) {
      setVoidError("A reason is required to delete this transaction.");
      return;
    }

    setVoidLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .update({ is_voided: true, void_reason: voidReason.trim() })
      .eq("id", modal.transaction.id);
    setVoidLoading(false);

    if (error) {
      setVoidError(error.message);
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== modal.transaction.id));
    closeModal();
  }

  const modalTitle =
    modal?.mode === "add"
      ? "New Transaction"
      : modal?.mode === "edit"
        ? `Edit ${modal.transaction.transaction_number}`
        : modal?.mode === "details"
          ? `${modal.transaction.transaction_number} Details`
          : modal?.mode === "delete"
            ? `Delete ${modal.transaction.transaction_number}`
            : "";

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          New Transaction
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by TID, truck, city, or broker..."
          className={`${inputClass} flex-1 min-w-[12rem]`}
        />
        <DateRangeFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />
      </div>

      <Modal open={modal !== null} onClose={closeModal} title={modalTitle} wide>
        {modal && modal.mode === "details" && (
          <div className="mb-4 flex justify-end">
            <Link
              href={`/dashboard/transactions/${modal.transaction.id}/receipt`}
              className={secondaryButtonClass}
            >
              <PrinterIcon />
              Print Receipt
            </Link>
          </div>
        )}
        {modal && modal.mode !== "delete" && (
          <TransactionForm
            mode={modal.mode === "add" ? "create" : modal.mode}
            referenceData={referenceData}
            initialValues={
              modal.mode !== "add" ? valuesFromTransaction(modal.transaction) : undefined
            }
            transactionId={modal.mode !== "add" ? modal.transaction.id : undefined}
            onSaved={(id) => handleSaved(id, modal.mode === "add")}
            onCancel={closeModal}
          />
        )}
        {modal && modal.mode === "delete" && (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Reason for deleting
            </label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              rows={2}
              className={inputClass}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={voidLoading}
                onClick={handleDelete}
                className={primaryButtonClass}
              >
                <TrashIcon />
                {voidLoading ? "Deleting..." : "Delete"}
              </button>
              <button type="button" onClick={closeModal} className={secondaryButtonClass}>
                Cancel
              </button>
            </div>
            {voidError && (
              <p className="text-sm text-red-700 dark:text-red-300">{voidError}</p>
            )}
          </div>
        )}
      </Modal>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Actions</th>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">TID</th>
              <th className="px-4 py-2 font-medium">Truck</th>
              <th className="px-4 py-2 font-medium">To</th>
              <th className="px-4 py-2 font-medium">Broker</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredTransactions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No transactions found.
                </td>
              </tr>
            )}

            {filteredTransactions.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      aria-label="Edit"
                      title="Edit"
                      className={secondaryButtonClass}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetails(t)}
                      aria-label="Details"
                      title="Details"
                      className={secondaryButtonClass}
                    >
                      <EyeIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDelete(t)}
                      aria-label="Delete"
                      title="Delete"
                      className={secondaryButtonClass}
                    >
                      <TrashIcon />
                    </button>
                    <Link
                      href={`/dashboard/transactions/${t.id}/receipt`}
                      aria-label="Receipt"
                      title="Receipt"
                      className={secondaryButtonClass}
                    >
                      <PrinterIcon />
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {t.transaction_date}
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {t.transaction_number}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {labelFor(referenceData.allTrucks, t.truck_id)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {labelFor(referenceData.cities, t.to_city_id)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {labelFor(referenceData.allBrokers, t.broker_id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
