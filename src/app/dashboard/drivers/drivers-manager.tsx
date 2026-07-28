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

// Drivers have no visible "active/inactive" concept in this UI — every
// record is treated as active (the DB column still exists and defaults to
// true, this page just never surfaces or flips it, which is the cheaper
// option vs. a migration to drop the column). Drivers also have no
// persistent association with trucks — that's tracked per-transaction
// instead (each transaction records its own specific truck_id/driver_id).
type Driver = {
  id: string;
  full_name: string;
  father_name: string | null;
  cnic: string | null;
  phone: string | null;
  whatsapp: string | null;
  created_at: string;
};

type DriverFormValues = {
  full_name: string;
  father_name: string;
  cnic: string;
  phone: string;
  whatsapp: string;
};

type ModalState = { mode: "add" | "edit" | "details"; driver?: Driver };

const EMPTY_FORM: DriverFormValues = {
  full_name: "",
  father_name: "",
  cnic: "",
  phone: "",
  whatsapp: "",
};

const DRIVER_COLUMNS =
  "id, full_name, father_name, cnic, phone, whatsapp, created_at";

function friendlyError(error: { code?: string; message: string }) {
  if (error.code === "23514") {
    return "CNIC must be 13 digits, with or without dashes (e.g. 12345-1234567-1).";
  }
  return error.message;
}

function sortByDateDesc(drivers: Driver[]) {
  return [...drivers].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// Keeps "03" as a sticky, non-removable prefix and caps the total at 11
// digits (03XXXXXXXXX — standard Pakistani mobile format).
function normalizePakPhone(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  const withPrefix = digitsOnly.startsWith("03") ? digitsOnly : `03${digitsOnly}`;
  return withPrefix.slice(0, 11);
}

function moveCursorToEnd(input: HTMLInputElement) {
  requestAnimationFrame(() => {
    const end = input.value.length;
    input.setSelectionRange(end, end);
  });
}

export function DriversManager({
  initialDrivers,
}: {
  initialDrivers: Driver[];
}) {
  const [drivers, setDrivers] = useState<Driver[]>(sortByDateDesc(initialDrivers));
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<DriverFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const query = search.trim().toLowerCase();
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.full_name.toLowerCase().includes(query) ||
      (driver.cnic ?? "").toLowerCase().includes(query) ||
      (driver.phone ?? "").toLowerCase().includes(query),
  );

  // A phone value that's still just "03" means the user focused the field
  // but never actually entered a number — treat that as not provided.
  function normalizedPhoneOrNull(value: string) {
    const trimmed = value.trim();
    return trimmed && trimmed !== "03" ? trimmed : null;
  }

  function validatePhone(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "03") return null;
    if (trimmed.length !== 11) {
      return "Mobile must be 11 digits (03XXXXXXXXX).";
    }
    return null;
  }

  function formFromDriver(driver: Driver): DriverFormValues {
    return {
      full_name: driver.full_name,
      father_name: driver.father_name ?? "",
      cnic: driver.cnic ?? "",
      phone: driver.phone ?? "",
      whatsapp: driver.whatsapp ?? "",
    };
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ mode: "add" });
  }

  function openEdit(driver: Driver) {
    setForm(formFromDriver(driver));
    setFormError(null);
    setModal({ mode: "edit", driver });
  }

  function openDetails(driver: Driver) {
    setForm(formFromDriver(driver));
    setFormError(null);
    setModal({ mode: "details", driver });
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

    const phoneError = validatePhone(form.phone);
    if (phoneError) {
      setFormError(phoneError);
      return;
    }

    setFormLoading(true);
    const supabase = createClient();
    const payload = {
      full_name,
      father_name: form.father_name.trim() || null,
      cnic: form.cnic.trim() || null,
      phone: normalizedPhoneOrNull(form.phone),
      whatsapp: form.whatsapp.trim() || null,
    };

    if (modal.mode === "add") {
      const { data, error } = await supabase
        .from("drivers")
        .insert(payload)
        .select(DRIVER_COLUMNS)
        .single();
      setFormLoading(false);

      if (error) {
        setFormError(friendlyError(error));
        return;
      }

      setDrivers((prev) => sortByDateDesc([...prev, data as Driver]));
      closeModal();
      return;
    }

    // edit
    const driver = modal.driver as Driver;
    const { data, error } = await supabase
      .from("drivers")
      .update(payload)
      .eq("id", driver.id)
      .select(DRIVER_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(friendlyError(error));
      return;
    }

    setDrivers((prev) =>
      sortByDateDesc(prev.map((d) => (d.id === driver.id ? (data as Driver) : d))),
    );
    closeModal();
  }

  const isDetails = modal?.mode === "details";
  const modalTitle =
    modal?.mode === "add"
      ? "New Driver"
      : modal?.mode === "edit"
        ? "Edit Driver"
        : "Driver Details";

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          New Driver
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, CNIC, or mobile..."
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
                  Father name
                </label>
                <input
                  disabled={isDetails}
                  value={form.father_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, father_name: e.target.value }))
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  CNIC
                </label>
                <input
                  disabled={isDetails}
                  value={form.cnic}
                  onChange={(e) => setForm((f) => ({ ...f, cnic: e.target.value }))}
                  placeholder="12345-1234567-1"
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Mobile
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  disabled={isDetails}
                  value={form.phone}
                  onFocus={(e) => {
                    setForm((f) => (f.phone ? f : { ...f, phone: "03" }));
                    moveCursorToEnd(e.target);
                  }}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      phone: normalizePakPhone(e.target.value),
                    }))
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  disabled={isDetails}
                  value={form.whatsapp}
                  onFocus={(e) => {
                    if (!form.whatsapp && form.phone.length === 11) {
                      setForm((f) => ({ ...f, whatsapp: f.phone }));
                      requestAnimationFrame(() => e.target.select());
                    }
                  }}
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
            {filteredDrivers.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No drivers found.
                </td>
              </tr>
            )}

            {filteredDrivers.map((driver) => (
              <tr key={driver.id}>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(driver)}
                      aria-label="Edit"
                      title="Edit"
                      className={secondaryButtonClass}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetails(driver)}
                      aria-label="Details"
                      title="Details"
                      className={secondaryButtonClass}
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {driver.full_name}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {driver.phone ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {driver.whatsapp ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
