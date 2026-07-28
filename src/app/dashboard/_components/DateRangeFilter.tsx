"use client";

import { useState } from "react";
import { inputClass } from "./ui";

type PresetKey = "today" | "yesterday" | "week" | "month" | "custom";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom Date" },
];

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  onChange,
}: {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
}) {
  const [preset, setPreset] = useState<PresetKey | null>(null);

  function selectPreset(key: PresetKey) {
    if (preset === key) {
      setPreset(null);
      onChange("", "");
      return;
    }

    setPreset(key);
    const today = new Date();
    const todayIso = toIsoDate(today);

    if (key === "today") {
      onChange(todayIso, todayIso);
    } else if (key === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const iso = toIsoDate(yesterday);
      onChange(iso, iso);
    } else if (key === "week") {
      onChange(toIsoDate(startOfWeek(today)), todayIso);
    } else if (key === "month") {
      onChange(toIsoDate(startOfMonth(today)), todayIso);
    }
    // "custom": leave dateFrom/dateTo untouched, just unlocks the inputs below.
  }

  const customEnabled = preset === "custom";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => selectPreset(p.key)}
          className={
            preset === p.key
              ? "rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white"
              : "rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          }
        >
          {p.label}
        </button>
      ))}
      <input
        type="date"
        value={dateFrom}
        disabled={!customEnabled}
        onChange={(e) => onChange(e.target.value, dateTo)}
        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
      />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">to</span>
      <input
        type="date"
        value={dateTo}
        disabled={!customEnabled}
        onChange={(e) => onChange(dateFrom, e.target.value)}
        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
      />
    </div>
  );
}
