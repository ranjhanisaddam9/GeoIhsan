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

// Cities have no visible "active/inactive" concept in this UI — every
// record is treated as active (the DB column still exists and defaults to
// true, this page just never surfaces or flips it, which is the cheaper
// option vs. a migration to drop the column).
type City = {
  id: string;
  name: string;
  created_at: string;
};

type CityFormValues = { name: string };

type ModalState = { mode: "add" | "edit"; city?: City };

const EMPTY_FORM: CityFormValues = { name: "" };

const CITY_COLUMNS = "id, name, created_at";

function sortByDateDesc(cities: City[]) {
  return [...cities].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function CitiesManager({ initialCities }: { initialCities: City[] }) {
  const [cities, setCities] = useState<City[]>(sortByDateDesc(initialCities));
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<CityFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const query = search.trim().toLowerCase();
  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(query),
  );

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModal({ mode: "add" });
  }

  function openEdit(city: City) {
    setForm({ name: city.name });
    setFormError(null);
    setModal({ mode: "edit", city });
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

    setFormLoading(true);
    const supabase = createClient();
    const payload = { name };

    if (modal.mode === "add") {
      const { data, error } = await supabase
        .from("cities")
        .insert(payload)
        .select(CITY_COLUMNS)
        .single();
      setFormLoading(false);

      if (error) {
        setFormError(
          friendlyPostgresError(error, "A city with this name already exists."),
        );
        return;
      }

      setCities((prev) => sortByDateDesc([...prev, data as City]));
      closeModal();
      return;
    }

    // edit
    const city = modal.city as City;
    const { data, error } = await supabase
      .from("cities")
      .update(payload)
      .eq("id", city.id)
      .select(CITY_COLUMNS)
      .single();
    setFormLoading(false);

    if (error) {
      setFormError(
        friendlyPostgresError(error, "A city with this name already exists."),
      );
      return;
    }

    setCities((prev) =>
      sortByDateDesc(prev.map((c) => (c.id === city.id ? (data as City) : c))),
    );
    closeModal();
  }

  const modalTitle = modal?.mode === "edit" ? "Edit City" : "New City";

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openAdd} className={primaryButtonClass}>
          <PlusIcon />
          New City
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
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
                  onChange={(e) => setForm({ name: e.target.value })}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredCities.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No cities found.
                </td>
              </tr>
            )}

            {filteredCities.map((city) => (
              <tr key={city.id}>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => openEdit(city)}
                    aria-label="Edit"
                    title="Edit"
                    className={secondaryButtonClass}
                  >
                    <PencilIcon />
                  </button>
                </td>
                <td className="px-4 py-2 text-black dark:text-zinc-50">{city.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
