"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../_components/ui";
import { CheckIcon, XMarkIcon } from "../_components/icons";

const TRUCK_COLUMNS = "id, truck_number";

function friendlyError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "That truck number already exists.";
  return error.message;
}

export function QuickAddTruck({
  initialValue,
  onCreated,
  onCancel,
}: {
  initialValue: string;
  onCreated: (row: { id: string; truck_number: string }) => void;
  onCancel: () => void;
}) {
  const [truckNumber, setTruckNumber] = useState(initialValue);
  const [truckType, setTruckType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ownerDetails, setOwnerDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = truckNumber.trim();
    if (!trimmed) {
      setError("Truck number is required.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("trucks")
      .insert({
        truck_number: trimmed,
        truck_type: truckType.trim() || null,
        capacity: capacity.trim() || null,
        owner_details: ownerDetails.trim() || null,
      })
      .select(TRUCK_COLUMNS)
      .single();
    setLoading(false);

    if (insertError) {
      setError(friendlyError(insertError));
      return;
    }

    onCreated(data as { id: string; truck_number: string });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Truck number
          </label>
          <input
            required
            autoFocus
            value={truckNumber}
            onChange={(e) => setTruckNumber(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Truck type
          </label>
          <input
            value={truckType}
            onChange={(e) => setTruckType(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Capacity
          </label>
          <input
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Owner Details
          </label>
          <input
            value={ownerDetails}
            onChange={(e) => setOwnerDetails(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          <CheckIcon />
          {loading ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          <XMarkIcon />
          Cancel
        </button>
      </div>
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
