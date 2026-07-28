"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { inputClass } from "./ui";

// `label` is what's matched against and shown in the dropdown list (e.g.
// "Ali Khan/03001234567", so two people sharing a name stay distinguishable);
// `displayLabel` is what shows in the input once an option is selected (e.g.
// just "Ali Khan"). Falls back to `label` when omitted.
export type ComboboxOption = { id: string; label: string; displayLabel?: string };

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
  onAddNew,
  addNewLabel = "record",
  className = "",
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  // When provided, an empty filtered list offers a "+ Add ..." action
  // instead of just "No match found".
  onAddNew?: (query: string) => void;
  addNewLabel?: string;
  // Extra classes appended to the input (e.g. taller padding for an
  // emphasized field).
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);
  const selectedLabel = selectedOption?.displayLabel ?? selectedOption?.label ?? "";

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectOption(o: ComboboxOption) {
    onChange(o.id);
    setQuery("");
    setIsOpen(false);
  }

  function handleAddNew() {
    if (!onAddNew) return;
    onAddNew(query.trim());
    setQuery("");
    setIsOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        setHighlighted(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) selectOption(filtered[highlighted]);
      else if (filtered.length === 0) handleAddNew();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        disabled={disabled}
        value={isOpen ? query : selectedLabel}
        placeholder={placeholder}
        onFocus={() => {
          setIsOpen(true);
          setQuery("");
          setHighlighted(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlighted(0);
        }}
        onKeyDown={handleKeyDown}
        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      />
      {isOpen && !disabled && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-zinc-300 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {filtered.length === 0 && (
            <>
              <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                No match found
              </li>
              {onAddNew && (
                <>
                  <li>
                    <hr className="border-zinc-200 dark:border-zinc-800" />
                  </li>
                  <li>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddNew();
                      }}
                      className="w-full px-3 py-2 text-left text-sm font-medium text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                    >
                      + Add new {addNewLabel}
                    </button>
                  </li>
                </>
              )}
            </>
          )}
          {filtered.map((o, i) => (
            <li
              key={o.id}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(o);
              }}
              className={`cursor-pointer px-3 py-2 text-sm text-black dark:text-zinc-50 ${
                i === highlighted ? "bg-green-50 dark:bg-green-950" : ""
              } ${o.id === value ? "font-medium" : ""}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
