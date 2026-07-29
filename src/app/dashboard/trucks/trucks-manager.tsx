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

// Trucks have no visible "active/inactive" concept in this UI — every
// record is treated as active (the DB column still exists and defaults to
// true, this page just never surfaces or flips it, which is the cheaper
// option vs. a migration to drop the column).
type Truck = {
  id: string;
  truck_number: string;
  truck_type: string | null;
  capacity: string | null;
  owner_details: string | null;
  created_at: string;
};

type TruckFormValues = {
  truck_number: string;
  truck_type: string;
  capacity: string;
  owner_details: string;
};

type ModalState = { mode: "add" | "edit" | "details"; truck?: Truck };

const EMPTY_FORM: TruckFormValues = {
  truck_number: "",
  truck_type: "",
  capacity: "",
  owner_details: "",
};

const TRUCK_COLUMNS =
  "id, truck_number, truck_type, capacity, owner_details, created_at";

function friendlyError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "That truck number already exists.";
  return error.message;
}

function sortByDateDesc(trucks: Truck[]) {
  return [...trucks].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function TrucksManager({ initialTrucks }: { initialTrucks: Truck[] }) {
  const [trucks, setTrucks] = useState<Truck[]>(sortByDateDesc(initialTrucks));
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<TruckFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const filteredTrucks = trucks.filter((truck) =>
    truck.truck_number.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function formFromTruck(truck: Truck): TruckFormValues {
    return {
      truck_number: truck.truck_number,
      truck_type: truck.truck_type ?? "",
      capacity: truck.capacity ?? "",
      owner_details: truck.owner_details ?? "",
    };
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ mode: "add" });
  }

  function openEdit(truck: Truck) {
    setForm(formFromTruck(truck));
    setFormError(null);
    setModal({ mode: "edit", truck });
  }

  function openDetails(truck: Truck) {
    setForm(formFromTruck(truck));
    setFormError(null);
    setModal({ mode: "details", truck });
  }

  function closeModal() {
    setModal(null);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || modal.mode === "details") return;
    setFormError(null);

    const truck_number = form.truck_number.trim();
    if (!truck_number) {
      setFormError("Truck number is required.");
      return;
    }

    setFormLoading(true);
    const supabase = createClient();
    const payload = {
      truck_number,
      truck_type: form.truck_type.trim() || null,
      capacity: form.capacity.trim() || null,
      owner_details: form.owner_details.trim() || null,
    };

    if (modal.mode === "add") {
      const { data, error } = await supabase
        .from("trucks")
        .insert(payload)
        .select(TRUCK_COLUMNS)
        .single();
      setFormLoading(false);

      if (error) {
        setFormError(friendlyError(error));
        return;
      }

      setTrucks((prev) => sortByDateDesc([...prev, data as Truck]));
      closeModal();
      return;
    }

    // edit
    const truck = modal.truck as Truck;
    const { data, error } = await supabase
      .from("trucks")
      .update(payload)
      .eq("id", truck.id)
      .select(TRUCK_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(friendlyError(error));
      return;
    }

    setTrucks((prev) =>
      sortByDateDesc(prev.map((t) => (t.id === truck.id ? (data as Truck) : t))),
    );
    closeModal();
  }

  const isDetails = modal?.mode === "details";
  const modalTitle =
    modal?.mode === "add"
      ? "New Truck"
      : modal?.mode === "edit"
        ? "Edit Truck"
        : "Truck Details";

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          New Truck
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by truck number..."
          className={`${inputClass} flex-1 min-w-[12rem]`}
        />
      </div>

      <Modal open={modal !== null} onClose={closeModal} title={modalTitle}>
        {modal && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Truck number
                </label>
                <input
                  required
                  disabled={isDetails}
                  value={form.truck_number}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, truck_number: e.target.value }))
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Truck type
                </label>
                <input
                  disabled={isDetails}
                  value={form.truck_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, truck_type: e.target.value }))
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Capacity
                </label>
                <input
                  disabled={isDetails}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: e.target.value }))
                  }
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Owner Details
                </label>
                <input
                  disabled={isDetails}
                  value={form.owner_details}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, owner_details: e.target.value }))
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
              <th className="px-4 py-2 font-medium">Truck Number</th>
              <th className="px-4 py-2 font-medium">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredTrucks.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No trucks found.
                </td>
              </tr>
            )}

            {filteredTrucks.map((truck) => (
              <tr key={truck.id}>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(truck)}
                      aria-label="Edit"
                      title="Edit"
                      className={secondaryButtonClass}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetails(truck)}
                      aria-label="Details"
                      title="Details"
                      className={secondaryButtonClass}
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {truck.truck_number}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {truck.truck_type ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
