"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "./_components/ui";
import { Combobox } from "./_components/Combobox";
import { Modal } from "./_components/Modal";
import { friendlyPostgresError } from "./_components/errors";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "./_components/icons";
import {
  TRUCK_WAITLIST_COLUMNS,
  labelFor,
  sortWaitlist,
  todayIso,
  toIntOrNull,
  type Option,
} from "./waitlist-shared";

export type TruckWaitlistRow = {
  id: string;
  entry_date: string;
  from_city_id: string;
  to_city_id: string;
  truck_id: string;
  load_date: string;
  driver_id: string | null;
  priority: number | null;
  comments: string | null;
};

type FormValues = {
  entry_date: string;
  from_city_id: string;
  to_city_id: string;
  truck_id: string;
  load_date: string;
  driver_id: string;
  priority: string;
  comments: string;
};

type ModalState = { mode: "add" } | { mode: "edit"; row: TruckWaitlistRow };

function emptyForm(): FormValues {
  return {
    entry_date: todayIso(),
    from_city_id: "",
    to_city_id: "",
    truck_id: "",
    load_date: todayIso(),
    driver_id: "",
    priority: "",
    comments: "",
  };
}

function formFromRow(row: TruckWaitlistRow): FormValues {
  return {
    entry_date: row.entry_date,
    from_city_id: row.from_city_id,
    to_city_id: row.to_city_id,
    truck_id: row.truck_id,
    load_date: row.load_date,
    driver_id: row.driver_id ?? "",
    priority: row.priority !== null ? String(row.priority) : "",
    comments: row.comments ?? "",
  };
}

export function TruckWaitlistManager({
  initialRows,
  cityOptions,
  truckOptions,
  driverOptions,
}: {
  initialRows: TruckWaitlistRow[];
  cityOptions: Option[];
  truckOptions: Option[];
  driverOptions: Option[];
}) {
  const [rows, setRows] = useState<TruckWaitlistRow[]>(sortWaitlist(initialRows));
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  function openAdd() {
    setForm(emptyForm());
    setFormError(null);
    setModal({ mode: "add" });
  }

  function openEdit(row: TruckWaitlistRow) {
    setForm(formFromRow(row));
    setFormError(null);
    setModal({ mode: "edit", row });
  }

  function closeModal() {
    setModal(null);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal) return;
    setFormError(null);

    if (!form.from_city_id) return setFormError("From City is required.");
    if (!form.to_city_id) return setFormError("To City is required.");
    if (!form.truck_id) return setFormError("Truck# is required.");

    setFormLoading(true);
    const supabase = createClient();
    const payload = {
      entry_date: form.entry_date,
      from_city_id: form.from_city_id,
      to_city_id: form.to_city_id,
      truck_id: form.truck_id,
      load_date: form.load_date,
      driver_id: form.driver_id || null,
      priority: toIntOrNull(form.priority),
      comments: form.comments.trim() || null,
    };

    const { data, error } =
      modal.mode === "add"
        ? await supabase
            .from("truck_waitlist")
            .insert(payload)
            .select(TRUCK_WAITLIST_COLUMNS)
            .single()
        : await supabase
            .from("truck_waitlist")
            .update(payload)
            .eq("id", modal.row.id)
            .select(TRUCK_WAITLIST_COLUMNS)
            .single();
    setFormLoading(false);

    if (error) {
      setFormError(friendlyPostgresError(error));
      return;
    }

    const saved = data as unknown as TruckWaitlistRow;
    setRows((prev) =>
      sortWaitlist(
        modal.mode === "add"
          ? [...prev, saved]
          : prev.map((r) => (r.id === saved.id ? saved : r)),
      ),
    );
    closeModal();
  }

  async function handleRemove(row: TruckWaitlistRow) {
    const supabase = createClient();
    const { error } = await supabase.from("truck_waitlist").delete().eq("id", row.id);
    if (error) return;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Truck Waitlist
        </h2>
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          Add to Waitlist
        </button>
      </div>

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modal?.mode === "edit" ? "Edit Waitlist Entry" : "New Waitlist Entry"}
      >
        {modal && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Date
                </label>
                <input
                  type="date"
                  value={form.entry_date}
                  onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Load Date
                </label>
                <input
                  type="date"
                  value={form.load_date}
                  onChange={(e) => setForm((f) => ({ ...f, load_date: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  From City
                </label>
                <Combobox
                  options={cityOptions}
                  value={form.from_city_id}
                  onChange={(id) => setForm((f) => ({ ...f, from_city_id: id }))}
                  placeholder="Search city..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  To City
                </label>
                <Combobox
                  options={cityOptions}
                  value={form.to_city_id}
                  onChange={(id) => setForm((f) => ({ ...f, to_city_id: id }))}
                  placeholder="Search city..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Truck#
                </label>
                <Combobox
                  options={truckOptions}
                  value={form.truck_id}
                  onChange={(id) => setForm((f) => ({ ...f, truck_id: id }))}
                  placeholder="Search truck..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Driver
                </label>
                <Combobox
                  options={driverOptions}
                  value={form.driver_id}
                  onChange={(id) => setForm((f) => ({ ...f, driver_id: id }))}
                  placeholder="Search driver..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Priority
                </label>
                <input
                  inputMode="numeric"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: e.target.value.replace(/\D/g, "") }))
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
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
              <th className="px-4 py-2 font-medium">From City</th>
              <th className="px-4 py-2 font-medium">To City</th>
              <th className="px-4 py-2 font-medium">Truck#</th>
              <th className="px-4 py-2 font-medium">Load Date</th>
              <th className="px-4 py-2 font-medium">Driver</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Comments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No trucks waiting.
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      aria-label="Edit"
                      title="Edit"
                      className={secondaryButtonClass}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(row)}
                      aria-label="Remove"
                      title="Remove"
                      className={secondaryButtonClass}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.entry_date}</td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {labelFor(cityOptions, row.from_city_id)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {labelFor(cityOptions, row.to_city_id)}
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {labelFor(truckOptions, row.truck_id)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.load_date}</td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {labelFor(driverOptions, row.driver_id)}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {row.priority ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {row.comments ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
