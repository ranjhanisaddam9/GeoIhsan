"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RECEIPT_LANGUAGES, type ReceiptLanguage } from "../transactions/[id]/receipt/receipt-labels";

export function SettingsForm({ initialLanguage }: { initialLanguage: ReceiptLanguage }) {
  const [language, setLanguage] = useState<ReceiptLanguage>(initialLanguage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleChange(value: ReceiptLanguage) {
    setLanguage(value);
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("app_settings")
      .update({ value })
      .eq("key", "receipt_language");

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="mt-6 max-w-xl rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="text-sm font-semibold text-black dark:text-zinc-50">
        Receipt Language
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Choose the language used for the printed transaction receipt.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {RECEIPT_LANGUAGES.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
          >
            <input
              type="radio"
              name="receipt_language"
              value={option.value}
              checked={language === option.value}
              onChange={() => handleChange(option.value)}
              disabled={saving}
              className="h-4 w-4 accent-green-600"
            />
            {option.label}
          </label>
        ))}
      </div>

      {saving && (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Saving...</p>
      )}
      {!saving && saved && (
        <p className="mt-3 text-sm text-green-700 dark:text-green-400">Saved.</p>
      )}
      {error && <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );
}
