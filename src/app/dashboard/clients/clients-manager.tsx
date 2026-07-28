"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../_components/ui";
import { Modal } from "../_components/Modal";
import {
  PlusIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ArrowLeftIcon,
} from "../_components/icons";

// Clients have no visible "active/inactive" concept in this UI — every
// record is treated as active (the DB column still exists and defaults to
// true, this page just never surfaces or flips it, which is the cheaper
// option vs. a migration to drop the column).
type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  created_at: string;
};

type ClientFormValues = {
  full_name: string;
  phone: string;
  whatsapp: string;
  address: string;
};

type ModalState = { mode: "add" | "edit" | "details"; client?: Client };

const EMPTY_FORM: ClientFormValues = {
  full_name: "",
  phone: "",
  whatsapp: "",
  address: "",
};

const CLIENT_COLUMNS = "id, full_name, phone, whatsapp, address, created_at";

function sortByDateDesc(clients: Client[]) {
  return [...clients].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function ClientsManager({
  initialClients,
}: {
  initialClients: Client[];
}) {
  const [clients, setClients] = useState<Client[]>(sortByDateDesc(initialClients));
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<ClientFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const query = search.trim().toLowerCase();
  const filteredClients = clients.filter(
    (client) =>
      client.full_name.toLowerCase().includes(query) ||
      (client.phone ?? "").toLowerCase().includes(query),
  );

  function formFromClient(client: Client): ClientFormValues {
    return {
      full_name: client.full_name,
      phone: client.phone ?? "",
      whatsapp: client.whatsapp ?? "",
      address: client.address ?? "",
    };
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ mode: "add" });
  }

  function openEdit(client: Client) {
    setForm(formFromClient(client));
    setFormError(null);
    setModal({ mode: "edit", client });
  }

  function openDetails(client: Client) {
    setForm(formFromClient(client));
    setFormError(null);
    setModal({ mode: "details", client });
  }

  function closeModal() {
    setModal(null);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || modal.mode === "details") return;
    setFormError(null);

    const full_name = form.full_name.trim();
    if (!full_name) {
      setFormError("Full name is required.");
      return;
    }

    setFormLoading(true);
    const supabase = createClient();
    const payload = {
      full_name,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      address: form.address.trim() || null,
    };

    if (modal.mode === "add") {
      const { data, error } = await supabase
        .from("clients")
        .insert(payload)
        .select(CLIENT_COLUMNS)
        .single();
      setFormLoading(false);

      if (error) {
        setFormError(error.message);
        return;
      }

      setClients((prev) => sortByDateDesc([...prev, data as Client]));
      closeModal();
      return;
    }

    // edit
    const client = modal.client as Client;
    const { data, error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", client.id)
      .select(CLIENT_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setClients((prev) =>
      sortByDateDesc(prev.map((c) => (c.id === client.id ? (data as Client) : c))),
    );
    closeModal();
  }

  const isDetails = modal?.mode === "details";
  const modalTitle =
    modal?.mode === "add"
      ? "New Client"
      : modal?.mode === "edit"
        ? "Edit Client"
        : "Client Details";

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          New Client
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile..."
          className={`${inputClass} flex-1 min-w-[12rem]`}
        />
      </div>

      <Modal open={modal !== null} onClose={closeModal} title={modalTitle}>
        {modal && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Full name
                </label>
                <input
                  required
                  disabled={isDetails}
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Mobile
                </label>
                <input
                  disabled={isDetails}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  WhatsApp
                </label>
                <input
                  disabled={isDetails}
                  value={form.whatsapp}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, whatsapp: e.target.value }))
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Address
                </label>
                <input
                  disabled={isDetails}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isDetails ? (
                <button type="button" onClick={closeModal} className={secondaryButtonClass}>
                  <ArrowLeftIcon />
                  Back
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className={primaryButtonClass}
                  >
                    <CheckIcon />
                    {formLoading
                      ? "Saving..."
                      : modal.mode === "edit"
                        ? "Update"
                        : "Save"}
                  </button>
                  <button type="button" onClick={closeModal} className={secondaryButtonClass}>
                    <XMarkIcon />
                    Cancel
                  </button>
                </>
              )}
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
              <th className="px-4 py-2 font-medium">Full Name</th>
              <th className="px-4 py-2 font-medium">Mobile</th>
              <th className="px-4 py-2 font-medium">WhatsApp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredClients.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No clients found.
                </td>
              </tr>
            )}

            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(client)}
                      aria-label="Edit"
                      title="Edit"
                      className={secondaryButtonClass}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetails(client)}
                      aria-label="Details"
                      title="Details"
                      className={secondaryButtonClass}
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {client.full_name}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {client.phone ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {client.whatsapp ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
