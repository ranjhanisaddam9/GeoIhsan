"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../_components/ui";
import { friendlyPostgresError } from "../_components/errors";
import { CheckIcon, XMarkIcon } from "../_components/icons";

const CITY_COLUMNS = "id, name";

export function QuickAddCity({
  initialValue,
  onCreated,
  onCancel,
}: {
  initialValue: string;
  onCreated: (row: { id: string; name: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("cities")
      .insert({ name: trimmed })
      .select(CITY_COLUMNS)
      .single();
    setLoading(false);

    if (insertError) {
      setError(
        friendlyPostgresError(insertError, "A city with this name already exists."),
      );
      return;
    }

    onCreated(data as { id: string; name: string });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name
        </label>
        <input
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
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
