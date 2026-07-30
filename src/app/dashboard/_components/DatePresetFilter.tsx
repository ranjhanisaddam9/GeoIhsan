"use client";

import { inputClass } from "./ui";
import {
  DATE_PRESET_LABELS,
  rangeForPreset,
  type DatePresetKey,
} from "./date-presets";

// Capsule row of date-range presets plus a from/to pair that only unlocks on
// "Custom Date". Controlled: the parent owns the selected preset and range,
// so it can filter with them however it likes.
export function DatePresetFilter({
  presets,
  preset,
  dateFrom,
  dateTo,
  onChange,
}: {
  presets: DatePresetKey[];
  preset: DatePresetKey | null;
  dateFrom: string;
  dateTo: string;
  onChange: (preset: DatePresetKey | null, from: string, to: string) => void;
}) {
  function selectPreset(key: DatePresetKey) {
    // Tapping the active capsule clears the filter.
    if (preset === key) {
      onChange(null, "", "");
      return;
    }
    const range = rangeForPreset(key);
    onChange(key, range?.from ?? dateFrom, range?.to ?? dateTo);
  }

  const customEnabled = preset === "custom";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => selectPreset(key)}
          className={
            preset === key
              ? "rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white"
              : "rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          }
        >
          {DATE_PRESET_LABELS[key]}
        </button>
      ))}
      <input
        type="date"
        value={dateFrom}
        disabled={!customEnabled}
        onChange={(e) => onChange(preset, e.target.value, dateTo)}
        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
      />
      <span className="text-sm text-zinc-500 dark:text-zinc-400">to</span>
      <input
        type="date"
        value={dateTo}
        disabled={!customEnabled}
        onChange={(e) => onChange(preset, dateFrom, e.target.value)}
        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
      />
    </div>
  );
}
