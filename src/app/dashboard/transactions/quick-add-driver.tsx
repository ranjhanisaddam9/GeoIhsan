"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "../_components/ui";
import { CheckIcon, XMarkIcon } from "../_components/icons";

const DRIVER_COLUMNS = "id, full_name, phone";

function friendlyError(error: { code?: string; message: string }) {
  if (error.code === "23514") {
    return "CNIC must be 13 digits, with or without dashes (e.g. 12345-1234567-1).";
  }
  return error.message;
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

export function QuickAddDriver({
  initialValue,
  onCreated,
  onCancel,
}: {
  initialValue: string;
  onCreated: (row: { id: string; full_name: string; phone: string | null }) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(initialValue);
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validatePhone(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "03") return null;
    if (trimmed.length !== 11) {
      return "Mobile must be 11 digits (03XXXXXXXXX).";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("Full name is required.");
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const trimmedPhone = phone.trim();
    const { data, error: insertError } = await supabase
      .from("drivers")
      .insert({
        full_name: trimmed,
        father_name: fatherName.trim() || null,
        cnic: cnic.trim() || null,
        phone: trimmedPhone && trimmedPhone !== "03" ? trimmedPhone : null,
        whatsapp: whatsapp.trim() || null,
      })
      .select(DRIVER_COLUMNS)
      .single();
    setLoading(false);

    if (insertError) {
      setError(friendlyError(insertError));
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
            Father name
          </label>
          <input
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            CNIC
          </label>
          <input
            value={cnic}
            onChange={(e) => setCnic(e.target.value)}
            placeholder="12345-1234567-1"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Mobile
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onFocus={(e) => {
              if (!phone) setPhone("03");
              moveCursorToEnd(e.target);
            }}
            onChange={(e) => setPhone(normalizePakPhone(e.target.value))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            WhatsApp
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={whatsapp}
            onFocus={(e) => {
              if (!whatsapp && phone.length === 11) {
                setWhatsapp(phone);
                requestAnimationFrame(() => e.target.select());
              }
            }}
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
