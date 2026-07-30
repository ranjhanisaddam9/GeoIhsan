"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "./_components/ui";
import { Combobox } from "./_components/Combobox";
import { Modal } from "./_components/Modal";
import { friendlyPostgresError } from "./_components/errors";
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from "./_components/icons";
import {
  CLIENT_WAITLIST_COLUMNS,
  labelFor,
  sortWaitlist,
  todayIso,
  toIntOrNull,
  type Option,
} from "./waitlist-shared";

export type ClientWaitlistRow = {
  id: string;
  entry_date: string;
  from_city_id: string;
  to_city_id: string;
  truck_qty: number | null;
  load_date: string;
  client_id: string;
  priority: number | null;
  comments: string | null;
};

type FormValues = {
  entry_date: string;
  from_city_id: string;
  to_city_id: string;
  truck_qty: string;
  load_date: string;
  client_id: string;
  priority: string;
  comments: string;
};

type ModalState = { mode: "add" } | { mode: "edit"; row: ClientWaitlistRow };

function emptyForm(): FormValues {
  return {
    entry_date: todayIso(),
    from_city_id: "",
    to_city_id: "",
    truck_qty: "",
    load_date: todayIso(),
    client_id: "",
    priority: "",
    comments: "",
  };
}

function formFromRow(row: ClientWaitlistRow): FormValues {
  return {
    entry_date: row.entry_date,
    from_city_id: row.from_city_id,
    to_city_id: row.to_city_id,
    truck_qty: row.truck_qty !== null ? String(row.truck_qty) : "",
    load_date: row.load_date,
    client_id: row.client_id,
    priority: row.priority !== null ? String(row.priority) : "",
    comments: row.comments ?? "",
  };
}

export function ClientWaitlistManager({
  initialRows,
  cityOptions,
  clientOptions,
}: {
  initialRows: ClientWaitlistRow[];
  cityOptions: Option[];
  clientOptions: Option[];
}) {
  const [rows, setRows] = useState<ClientWaitlistRow[]>(sortWaitlist(initialRows));
  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  function openAdd() {
    setForm(emptyForm());
    setFormError(null);
    setModal({ mode: "add" });
  }

  function openEdit(row: ClientWaitlistRow) {
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
    if (!form.client_id) return setFormError("Client is required.");

    setFormLoading(true);
    const supabase = createClient();
    const payload = {
      entry_date: form.entry_date,
      from_city_id: form.from_city_id,
      to_city_id: form.to_city_id,
      truck_qty: toIntOrNull(form.truck_qty),
      load_date: form.load_date,
      client_id: form.client_id,
      priority: toIntOrNull(form.priority),
      comments: form.comments.trim() || null,
    };

    const { data, error } =
      modal.mode === "add"
        ? await supabase
            .from("client_waitlist")
            .insert(payload)
            .select(CLIENT_WAITLIST_COLUMNS)
            .single()
        : await supabase
            .from("client_waitlist")
            .update(payload)
            .eq("id", modal.row.id)
            .select(CLIENT_WAITLIST_COLUMNS)
            .single();
    setFormLoading(false);

    if (error) {
      setFormError(friendlyPostgresError(error));
      return;
    }

    const saved = data as unknown as ClientWaitlistRow;
    setRows((prev) =>
      sortWaitlist(
        modal.mode === "add"
          ? [...prev, saved]
          : prev.map((r) => (r.id === saved.id ? saved : r)),
      ),
    );
    closeModal();
  }

  async function handleRemove(row: ClientWaitlistRow) {
    const supabase = createClient();
    const { error } = await supabase.from("client_waitlist").delete().eq("id", row.id);
    if (error) return;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Client Waitlist
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
                  Client
                </label>
                <Combobox
                  options={clientOptions}
                  value={form.client_id}
                  onChange={(id) => setForm((f) => ({ ...f, client_id: id }))}
                  placeholder="Search client..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Truck Qty
                </label>
                <input
                  inputMode="numeric"
                  value={form.truck_qty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, truck_qty: e.target.value.replace(/\D/g, "") }))
                  }
                  className={inputClass}
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
              <th className="px-4 py-2 font-medium">Truck Qty</th>
              <th className="px-4 py-2 font-medium">Load Date</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Comments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                  No clients waiting.
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
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {row.truck_qty ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.load_date}</td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {labelFor(clientOptions, row.client_id)}
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
