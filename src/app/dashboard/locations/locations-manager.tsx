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
import { PlusIcon, PencilIcon, CheckIcon, XMarkIcon } from "../_components/icons";

// Locations have no visible "active/inactive" concept in this UI — every
// record is treated as active (the DB column still exists and defaults to
// true, this page just never surfaces or flips it, which is the cheaper
// option vs. a migration to drop the column).
type Location = {
  id: string;
  name: string;
  address: string | null;
  city_id: string | null;
  created_at: string;
};

type CityOption = { id: string; label: string };

type LocationFormValues = {
  name: string;
  address: string;
  city_id: string;
};

type ModalState = { mode: "add" | "edit"; location?: Location };

const EMPTY_FORM: LocationFormValues = { name: "", address: "", city_id: "" };

const LOCATION_COLUMNS = "id, name, address, city_id, created_at";

function sortByDateDesc(locations: Location[]) {
  return [...locations].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function LocationsManager({
  initialLocations,
  cityOptions,
}: {
  initialLocations: Location[];
  cityOptions: CityOption[];
}) {
  const [locations, setLocations] = useState<Location[]>(
    sortByDateDesc(initialLocations),
  );
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<LocationFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const cityNameById = new Map(cityOptions.map((c) => [c.id, c.label]));

  const query = search.trim().toLowerCase();
  const filteredLocations = locations.filter((location) => {
    const cityLabel = cityNameById.get(location.city_id ?? "") ?? "";
    return (
      location.name.toLowerCase().includes(query) ||
      cityLabel.toLowerCase().includes(query) ||
      (location.address ?? "").toLowerCase().includes(query)
    );
  });

  function formFromLocation(location: Location): LocationFormValues {
    return {
      name: location.name,
      address: location.address ?? "",
      city_id: location.city_id ?? "",
    };
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ mode: "add" });
  }

  function openEdit(location: Location) {
    setForm(formFromLocation(location));
    setFormError(null);
    setModal({ mode: "edit", location });
  }

  function closeModal() {
    setModal(null);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal) return;
    setFormError(null);

    const name = form.name.trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (!form.city_id) {
      setFormError("City is required.");
      return;
    }

    setFormLoading(true);
    const supabase = createClient();
    const payload = {
      name,
      address: form.address.trim() || null,
      city_id: form.city_id,
    };

    if (modal.mode === "add") {
      const { data, error } = await supabase
        .from("locations")
        .insert(payload)
        .select(LOCATION_COLUMNS)
        .single();
      setFormLoading(false);

      if (error) {
        setFormError(friendlyPostgresError(error));
        return;
      }

      setLocations((prev) => sortByDateDesc([...prev, data as Location]));
      closeModal();
      return;
    }

    // edit
    const location = modal.location as Location;
    const { data, error } = await supabase
      .from("locations")
      .update(payload)
      .eq("id", location.id)
      .select(LOCATION_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(friendlyPostgresError(error));
      return;
    }

    setLocations((prev) =>
      sortByDateDesc(
        prev.map((l) => (l.id === location.id ? (data as Location) : l)),
      ),
    );
    closeModal();
  }

  const modalTitle = modal?.mode === "edit" ? "Edit Location" : "New Location";

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          New Location
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, city, or address..."
          className={`${inputClass} flex-1 min-w-[12rem]`}
        />
      </div>

      <Modal open={modal !== null} onClose={closeModal} title={modalTitle}>
        {modal && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  City
                </label>
                <select
                  required
                  value={form.city_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city_id: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">Select city...</option>
                  {cityOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
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
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">City</th>
              <th className="px-4 py-2 font-medium">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredLocations.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No locations found.
                </td>
              </tr>
            )}

            {filteredLocations.map((location) => (
              <tr key={location.id}>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => openEdit(location)}
                    aria-label="Edit"
                    title="Edit"
                    className={secondaryButtonClass}
                  >
                    <PencilIcon />
                  </button>
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">
                  {location.name}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {cityNameById.get(location.city_id ?? "") ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                  {location.address ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
