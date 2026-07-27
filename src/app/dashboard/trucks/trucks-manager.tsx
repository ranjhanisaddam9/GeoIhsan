"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Truck = {
  id: string;
  truck_number: string;
  truck_type: string | null;
  capacity: string | null;
  is_active: boolean;
  created_at: string;
};

type TruckFormValues = {
  truck_number: string;
  truck_type: string;
  capacity: string;
};

const EMPTY_FORM: TruckFormValues = {
  truck_number: "",
  truck_type: "",
  capacity: "",
};

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const primaryButtonClass =
  "rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200";
const secondaryButtonClass =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900";

function friendlyError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "That truck number already exists.";
  return error.message;
}

function sortByTruckNumber(trucks: Truck[]) {
  return [...trucks].sort((a, b) => a.truck_number.localeCompare(b.truck_number));
}

const TRUCK_COLUMNS =
  "id, truck_number, truck_type, capacity, is_active, created_at";

export function TrucksManager({ initialTrucks }: { initialTrucks: Truck[] }) {
  const [trucks, setTrucks] = useState<Truck[]>(initialTrucks);
  const [search, setSearch] = useState("");

  const [addForm, setAddForm] = useState<TruckFormValues>(EMPTY_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TruckFormValues>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const filteredTrucks = trucks.filter((truck) =>
    truck.truck_number.toLowerCase().includes(search.trim().toLowerCase()),
  );

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddError(null);

    const truck_number = addForm.truck_number.trim();
    if (!truck_number) {
      setAddError("Truck number is required.");
      return;
    }

    setAddLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trucks")
      .insert({
        truck_number,
        truck_type: addForm.truck_type.trim() || null,
        capacity: addForm.capacity.trim() || null,
      })
      .select(TRUCK_COLUMNS)
      .single();
    setAddLoading(false);

    if (error) {
      setAddError(friendlyError(error));
      return;
    }

    setTrucks((prev) => sortByTruckNumber([...prev, data as Truck]));
    setAddForm(EMPTY_FORM);
  }

  function startEdit(truck: Truck) {
    setEditingId(truck.id);
    setEditForm({
      truck_number: truck.truck_number,
      truck_type: truck.truck_type ?? "",
      capacity: truck.capacity ?? "",
    });
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditError(null);

    const truck_number = editForm.truck_number.trim();
    if (!truck_number) {
      setEditError("Truck number is required.");
      return;
    }

    setEditLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trucks")
      .update({
        truck_number,
        truck_type: editForm.truck_type.trim() || null,
        capacity: editForm.capacity.trim() || null,
      })
      .eq("id", id)
      .select(TRUCK_COLUMNS)
      .single();
    setEditLoading(false);

    if (error) {
      setEditError(friendlyError(error));
      return;
    }

    setTrucks((prev) =>
      sortByTruckNumber(prev.map((t) => (t.id === id ? (data as Truck) : t))),
    );
    setEditingId(null);
  }

  async function toggleActive(truck: Truck) {
    setToggleError(null);
    setTogglingId(truck.id);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trucks")
      .update({ is_active: !truck.is_active })
      .eq("id", truck.id)
      .select(TRUCK_COLUMNS)
      .single();
    setTogglingId(null);

    if (error) {
      setToggleError(error.message);
      return;
    }

    setTrucks((prev) =>
      prev.map((t) => (t.id === truck.id ? (data as Truck) : t)),
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-end sm:flex-wrap"
      >
        <div className="flex flex-1 min-w-[10rem] flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Truck number
          </label>
          <input
            required
            value={addForm.truck_number}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, truck_number: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div className="flex flex-1 min-w-[10rem] flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Truck type
          </label>
          <input
            value={addForm.truck_type}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, truck_type: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <div className="flex flex-1 min-w-[10rem] flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Capacity
          </label>
          <input
            value={addForm.capacity}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, capacity: e.target.value }))
            }
            className={inputClass}
          />
        </div>
        <button type="submit" disabled={addLoading} className={primaryButtonClass}>
          {addLoading ? "Adding..." : "Add Truck"}
        </button>
        {addError && (
          <p className="w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {addError}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by truck number..."
          className={`${inputClass} max-w-xs`}
        />

        {toggleError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {toggleError}
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">Truck Number</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Capacity</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredTrucks.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No trucks found.
                  </td>
                </tr>
              )}

              {filteredTrucks.map((truck) => {
                const isEditing = editingId === truck.id;

                if (isEditing) {
                  return (
                    <tr key={truck.id} className="bg-zinc-50 dark:bg-zinc-900">
                      <td className="px-4 py-2">
                        <input
                          value={editForm.truck_number}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              truck_number: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.truck_type}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              truck_type: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.capacity}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              capacity: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </td>
                      <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">
                        {truck.is_active ? "Active" : "Inactive"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={editLoading}
                              onClick={() => saveEdit(truck.id)}
                              className={primaryButtonClass}
                            >
                              {editLoading ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className={secondaryButtonClass}
                            >
                              Cancel
                            </button>
                          </div>
                          {editError && (
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {editError}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={truck.id}>
                    <td className="px-4 py-2 text-black dark:text-zinc-50">
                      {truck.truck_number}
                    </td>
                    <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                      {truck.truck_type ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                      {truck.capacity ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={
                          truck.is_active
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }
                      >
                        {truck.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(truck)}
                          className={secondaryButtonClass}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={togglingId === truck.id}
                          onClick={() => toggleActive(truck)}
                          className={secondaryButtonClass}
                        >
                          {togglingId === truck.id
                            ? "Saving..."
                            : truck.is_active
                              ? "Deactivate"
                              : "Reactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
