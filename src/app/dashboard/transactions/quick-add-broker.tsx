"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../_components/ui";
import { CheckIcon, XMarkIcon } from "../_components/icons";

const BROKER_COLUMNS = "id, full_name, phone";

export function QuickAddBroker({
  initialValue,
  onCreated,
  onCancel,
}: {
  initialValue: string;
  onCreated: (row: { id: string; full_name: string; phone: string | null }) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(initialValue);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("Full name is required.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("brokers")
      .insert({
        full_name: trimmed,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
      })
      .select(BROKER_COLUMNS)
      .single();
    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onCreated(data as { id: string; full_name: string; phone: string | null });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Full name
          </label>
          <input
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Mobile
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            WhatsApp
          </label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
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
