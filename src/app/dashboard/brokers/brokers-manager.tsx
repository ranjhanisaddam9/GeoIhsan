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

// Brokers have no visible "active/inactive" concept in this UI — every
// record is treated as active (the DB column still exists and defaults to
// true, this page just never surfaces or flips it, which is the cheaper
// option vs. a migration to drop the column). Brokers also have no
// persistent association with locations — those are separate records.
type Broker = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  created_at: string;
};

type BrokerFormValues = {
  full_name: string;
  phone: string;
  whatsapp: string;
};

type ModalState = { mode: "add" | "edit" | "details"; broker?: Broker };

const EMPTY_FORM: BrokerFormValues = {
  full_name: "",
  phone: "",
  whatsapp: "",
};

const BROKER_COLUMNS = "id, full_name, phone, whatsapp, created_at";

function sortByDateDesc(brokers: Broker[]) {
  return [...brokers].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function BrokersManager({
  initialBrokers,
}: {
  initialBrokers: Broker[];
}) {
  const [brokers, setBrokers] = useState<Broker[]>(sortByDateDesc(initialBrokers));
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<BrokerFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const query = search.trim().toLowerCase();
  const filteredBrokers = brokers.filter(
    (broker) =>
      broker.full_name.toLowerCase().includes(query) ||
      (broker.phone ?? "").toLowerCase().includes(query),
  );

  function formFromBroker(broker: Broker): BrokerFormValues {
    return {
      full_name: broker.full_name,
      phone: broker.phone ?? "",
      whatsapp: broker.whatsapp ?? "",
    };
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ mode: "add" });
  }

  function openEdit(broker: Broker) {
    setForm(formFromBroker(broker));
    setFormError(null);
    setModal({ mode: "edit", broker });
  }

  function openDetails(broker: Broker) {
    setForm(formFromBroker(broker));
    setFormError(null);
    setModal({ mode: "details", broker });
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
    };

    if (modal.mode === "add") {
      const { data, error } = await supabase
        .from("brokers")
        .insert(payload)
        .select(BROKER_COLUMNS)
        .single();
      setFormLoading(false);

      if (error) {
        setFormError(error.message);
        return;
      }

      setBrokers((prev) => sortByDateDesc([...prev, data as Broker]));
      closeModal();
      return;
    }

    // edit
    const broker = modal.broker as Broker;
    const { data, error } = await supabase
      .from("brokers")
      .update(payload)
      .eq("id", broker.id)
      .select(BROKER_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setBrokers((prev) =>
      sortByDateDesc(prev.map((b) => (b.id === broker.id ? (data as Broker) : b))),
    );
    closeModal();
  }

  const isDetails = modal?.mode === "details";
  const modalTitle =
    modal?.mode === "add"
      ? "New Broker"
      : modal?.mode === "edit"
        ? "Edit Broker"
        : "Broker Details";

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          New Broker
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
            {filteredBrokers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No brokers found.
                </td>
              </tr>
            )}

            {filteredBrokers.map((broker) => (
              <tr key={broker.id}>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(broker)}
                      aria-label="Edit"
                      title="Edit"
                      className={secondaryButtonClass}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetails(broker)}
                      aria-label="Details"
                      title="Details"
                      className={secondaryButtonClass}
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {broker.full_name}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {broker.phone ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {broker.whatsapp ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
