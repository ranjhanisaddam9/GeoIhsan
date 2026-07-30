"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../_components/ui";
import { Modal } from "../_components/Modal";
import { friendlyPostgresError } from "../_components/errors";
import { isWithinDateRange } from "../_components/date-utils";
import { DatePresetFilter } from "../_components/DatePresetFilter";
import { todayIso, type DatePresetKey } from "../_components/date-presets";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "../_components/icons";
import { EXPENSE_CATEGORIES } from "./expense-categories";

type Expense = {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  comments: string | null;
  created_at: string;
};

type FormValues = {
  expense_date: string;
  category: string;
  amount: string;
  comments: string;
};

type ModalState = { mode: "add" } | { mode: "edit"; expense: Expense };

const EXPENSE_COLUMNS = "id, expense_date, category, amount, comments, created_at";

function emptyForm(): FormValues {
  return { expense_date: todayIso(), category: "", amount: "", comments: "" };
}

function formFromExpense(expense: Expense): FormValues {
  return {
    expense_date: expense.expense_date,
    category: expense.category,
    amount: String(expense.amount),
    comments: expense.comments ?? "",
  };
}

// Keeps only digits and at most one decimal point as the user types.
function normalizeAmount(raw: string) {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

function sortByDateDesc(expenses: Expense[]) {
  return [...expenses].sort(
    (a, b) => b.expense_date.localeCompare(a.expense_date) || b.created_at.localeCompare(a.created_at),
  );
}

export function ExpensesManager({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState<Expense[]>(sortByDateDesc(initialExpenses));
  const [search, setSearch] = useState("");
  const [preset, setPreset] = useState<DatePresetKey | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const query = search.trim().toLowerCase();
  const filteredExpenses = expenses.filter((expense) => {
    if (!isWithinDateRange(expense.expense_date, dateFrom, dateTo)) return false;
    return (
      expense.category.toLowerCase().includes(query) ||
      (expense.comments ?? "").toLowerCase().includes(query)
    );
  });

  function openAdd() {
    setForm(emptyForm());
    setFormError(null);
    setModal({ mode: "add" });
  }

  function openEdit(expense: Expense) {
    setForm(formFromExpense(expense));
    setFormError(null);
    setModal({ mode: "edit", expense });
  }

  function closeModal() {
    setModal(null);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal) return;
    setFormError(null);

    if (!form.category) return setFormError("Expense is required.");
    const amount = Number(form.amount);
    if (!form.amount.trim() || Number.isNaN(amount) || amount < 0) {
      return setFormError("Amount must be a valid non-negative number.");
    }

    setFormLoading(true);
    const supabase = createClient();
    const payload = {
      expense_date: form.expense_date,
      category: form.category,
      amount,
      comments: form.comments.trim() || null,
    };

    if (modal.mode === "add") {
      const { data, error } = await supabase
        .from("expenses")
        .insert(payload)
        .select(EXPENSE_COLUMNS)
        .single();
      setFormLoading(false);

      if (error) {
        setFormError(friendlyPostgresError(error));
        return;
      }

      setExpenses((prev) => sortByDateDesc([...prev, data as Expense]));
      closeModal();
      return;
    }

    // edit
    const expense = modal.expense;
    const { data, error } = await supabase
      .from("expenses")
      .update(payload)
      .eq("id", expense.id)
      .select(EXPENSE_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(friendlyPostgresError(error));
      return;
    }

    setExpenses((prev) =>
      sortByDateDesc(prev.map((e) => (e.id === expense.id ? (data as Expense) : e))),
    );
    closeModal();
  }

  async function handleRemove(expense: Expense) {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
    if (error) return;
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
  }

  const modalTitle = modal?.mode === "edit" ? "Edit Expense" : "New Expense";

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          Add Expense
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by expense or comments..."
          className={`${inputClass} flex-1 min-w-[12rem]`}
        />
      </div>

      <DatePresetFilter
        presets={[
          "today",
          "yesterday",
          "week",
          "last_week",
          "month",
          "last_month",
          "year",
          "last_year",
          "custom",
        ]}
        preset={preset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={(nextPreset, from, to) => {
          setPreset(nextPreset);
          setDateFrom(from);
          setDateTo(to);
        }}
      />

      <Modal open={modal !== null} onClose={closeModal} title={modalTitle}>
        {modal && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Date
                </label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expense_date: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Expense
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select expense...</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Amount
                </label>
                <input
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: normalizeAmount(e.target.value) }))
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Comments
                </label>
                <input
                  value={form.comments}
                  onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={formLoading} className={primaryButtonClass}>
                <CheckIcon />
                {formLoading ? "Saving..." : modal.mode === "edit" ? "Update" : "Save"}
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
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Expense</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Comments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No expenses found.
                </td>
              </tr>
            )}

            {filteredExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(expense)}
                      aria-label="Edit"
                      title="Edit"
                      className={secondaryButtonClass}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(expense)}
                      aria-label="Delete"
                      title="Delete"
                      className={secondaryButtonClass}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {expense.expense_date}
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">{expense.category}</td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {expense.amount.toFixed(2)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {expense.comments ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
