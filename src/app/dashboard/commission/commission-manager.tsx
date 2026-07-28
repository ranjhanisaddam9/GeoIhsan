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
import {
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  BanIcon,
  ArrowPathIcon,
  TrashIcon,
} from "../_components/icons";

type CommissionRate = {
  id: string;
  from_city_id: string;
  to_city_id: string;
  amount: string;
  is_active: boolean;
  created_at: string;
};

type CityOption = { id: string; label: string };

type RateFormValues = {
  from_city_id: string;
  to_city_id: string;
  amount: string;
};

const EMPTY_FORM: RateFormValues = { from_city_id: "", to_city_id: "", amount: "" };

const RATE_COLUMNS = "id, from_city_id, to_city_id, amount, is_active, created_at";

const UNIQUE_ROUTE_ERROR =
  "Only one active rate is allowed per route — deactivate the current one first.";

function sortByDateDesc(rates: CommissionRate[]) {
  return [...rates].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function CommissionManager({
  initialRates,
  cityOptions,
}: {
  initialRates: CommissionRate[];
  cityOptions: CityOption[];
}) {
  const [rates, setRates] = useState<CommissionRate[]>(sortByDateDesc(initialRates));
  const [search, setSearch] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<RateFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const cityNameById = new Map(cityOptions.map((c) => [c.id, c.label]));

  const query = search.trim().toLowerCase();
  const filteredRates = rates.filter((rate) => {
    const fromLabel = cityNameById.get(rate.from_city_id) ?? "";
    const toLabel = cityNameById.get(rate.to_city_id) ?? "";
    return (
      fromLabel.toLowerCase().includes(query) ||
      toLabel.toLowerCase().includes(query)
    );
  });

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsAddOpen(true);
  }

  function closeAdd() {
    setIsAddOpen(false);
    setFormError(null);
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.from_city_id || !form.to_city_id) {
      setFormError("From City and To City are required.");
      return;
    }
    const amount = Number(form.amount);
    if (form.amount.trim() === "" || Number.isNaN(amount) || amount < 0) {
      setFormError("Amount must be a valid, non-negative number.");
      return;
    }

    setFormLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("commission_rates")
      .insert({
        from_city_id: form.from_city_id,
        to_city_id: form.to_city_id,
        amount,
      })
      .select(RATE_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(friendlyPostgresError(error, UNIQUE_ROUTE_ERROR));
      return;
    }

    // Adding a new active rate auto-expires the previous active rate for
    // the same route (DB trigger) — reflect that locally too.
    setRates((prev) =>
      sortByDateDesc([
        ...prev.map((r) =>
          r.from_city_id === form.from_city_id && r.to_city_id === form.to_city_id
            ? { ...r, is_active: false }
            : r,
        ),
        data as CommissionRate,
      ]),
    );
    closeAdd();
  }

  async function toggleActive(rate: CommissionRate) {
    setRowError(null);
    setTogglingId(rate.id);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("commission_rates")
      .update({ is_active: !rate.is_active })
      .eq("id", rate.id)
      .select(RATE_COLUMNS)
      .single();
    setTogglingId(null);

    if (error) {
      setRowError(friendlyPostgresError(error, UNIQUE_ROUTE_ERROR));
      return;
    }

    setRates((prev) =>
      prev.map((r) => (r.id === rate.id ? (data as CommissionRate) : r)),
    );
  }

  // No direct foreign key links transactions to commission_rates (a
  // transaction just stores a plain commission_amount copied at creation
  // time), so "associated" is determined by route: any transaction whose
  // From City and To City match this rate's route directly.
  async function routeHasTransactions(fromCityId: string, toCityId: string) {
    const supabase = createClient();
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("from_city_id", fromCityId)
      .eq("to_city_id", toCityId);

    return (count ?? 0) > 0;
  }

  async function handleDelete(rate: CommissionRate) {
    setRowError(null);
    setDeletingId(rate.id);

    const hasTransactions = await routeHasTransactions(
      rate.from_city_id,
      rate.to_city_id,
    );
    if (hasTransactions) {
      setDeletingId(null);
      setRowError(
        "Cannot delete: transactions exist for this route. Deactivate the rate instead.",
      );
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("commission_rates").delete().eq("id", rate.id);
    setDeletingId(null);

    if (error) {
      setRowError(error.message);
      return;
    }

    setRates((prev) => prev.filter((r) => r.id !== rate.id));
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          New Commission Rate
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by city..."
          className={`${inputClass} flex-1 min-w-[12rem]`}
        />
      </div>

      <Modal open={isAddOpen} onClose={closeAdd} title="New Commission Rate">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                From City
              </label>
              <select
                required
                value={form.from_city_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, from_city_id: e.target.value }))
                }
                className={inputClass}
              >
                <option value="">Select from city...</option>
                {cityOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                To City
              </label>
              <select
                required
                value={form.to_city_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, to_city_id: e.target.value }))
                }
                className={inputClass}
              >
                <option value="">Select to city...</option>
                {cityOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Amount
              </label>
              <input
                required
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={formLoading} className={primaryButtonClass}>
              <CheckIcon />
              {formLoading ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={closeAdd} className={secondaryButtonClass}>
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
      </Modal>

      {rowError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {rowError}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Actions</th>
              <th className="px-4 py-2 font-medium">From City</th>
              <th className="px-4 py-2 font-medium">To City</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredRates.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No commission rates found.
                </td>
              </tr>
            )}

            {filteredRates.map((rate) => (
              <tr key={rate.id}>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={togglingId === rate.id}
                      onClick={() => toggleActive(rate)}
                      aria-label={rate.is_active ? "Deactivate" : "Reactivate"}
                      title={rate.is_active ? "Deactivate" : "Reactivate"}
                      className={secondaryButtonClass}
                    >
                      {rate.is_active ? <BanIcon /> : <ArrowPathIcon />}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === rate.id}
                      onClick={() => handleDelete(rate)}
                      aria-label="Delete"
                      title="Delete"
                      className={secondaryButtonClass}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {cityNameById.get(rate.from_city_id) ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {cityNameById.get(rate.to_city_id) ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {rate.amount}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      rate.is_active
                        ? "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }
                  >
                    {rate.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
