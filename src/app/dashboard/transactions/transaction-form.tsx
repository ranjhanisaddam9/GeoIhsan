"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../_components/ui";
import { ArrowLeftIcon } from "../_components/icons";
import { Combobox } from "../_components/Combobox";
import { Modal } from "../_components/Modal";
import { TRANSACTION_COLUMNS } from "./transaction-constants";
import { QuickAddTruck } from "./quick-add-truck";
import { QuickAddDriver } from "./quick-add-driver";
import { QuickAddClient } from "./quick-add-client";
import { QuickAddBroker } from "./quick-add-broker";
import { QuickAddCity } from "./quick-add-city";
import type {
  SimpleOption,
  TransactionFormReferenceData,
} from "./get-form-reference-data";

export type TransactionFormValues = {
  transaction_date: string;
  from_city_id: string;
  to_city_id: string;
  to_location_id: string;
  truck_id: string;
  driver_id: string;
  client_id: string;
  broker_id: string;
  item_name: string;
  quantity: string;
  weight: string;
  weighing_bridge_cost: string;
  loading_labour_charges: string;
  fare_charges: string;
  extra_charges: string;
  advance_fare: string;
  commission_amount: string;
  commission_paid: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// New transactions default From City to Dadu (the station's home city).
function defaultFromCityId(cities: SimpleOption[]) {
  return cities.find((c) => c.label.toLowerCase() === "dadu")?.id ?? "";
}

export function defaultTransactionFormValues(cities: SimpleOption[]): TransactionFormValues {
  return {
    transaction_date: todayIso(),
    from_city_id: defaultFromCityId(cities),
    to_city_id: "",
    to_location_id: "",
    truck_id: "",
    driver_id: "",
    client_id: "",
    broker_id: "",
    item_name: "",
    quantity: "",
    weight: "",
    weighing_bridge_cost: "",
    loading_labour_charges: "",
    fare_charges: "",
    extra_charges: "0.00",
    advance_fare: "",
    commission_amount: "0.00",
    commission_paid: "0.00",
  };
}

// Keeps only digits and at most one decimal point as the user types.
function normalizeNumeric(raw: string) {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return (
    cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
}

// Keeps the form's current value selectable/visible even if it points at a
// row that's since been deactivated (e.g. editing an old transaction whose
// truck was later retired) — same "superset for display" pattern used by
// SimpleEntityManager's labelOptions.
function withCurrentOption<T extends SimpleOption>(
  active: T[],
  all: T[],
  currentId: string,
): T[] {
  if (!currentId || active.some((o) => o.id === currentId)) return active;
  const current = all.find((o) => o.id === currentId);
  return current ? [current, ...active] : active;
}

function toNumber(value: string) {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

// If no active commission rate exists yet for this From City -> To City
// route, saving a transaction with a commission amount creates one — so the
// next transaction on the same route auto-fills from it. Best-effort: a
// failure here should never block the transaction save itself.
async function ensureCommissionRate(fromCityId: string, toCityId: string, amount: number) {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("commission_rates")
    .select("id")
    .eq("from_city_id", fromCityId)
    .eq("to_city_id", toCityId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) return;

  await supabase
    .from("commission_rates")
    .insert({ from_city_id: fromCityId, to_city_id: toCityId, amount });
}

export function formatMoney(n: number) {
  return n.toFixed(2);
}

function validate(form: TransactionFormValues): string | null {
  const required: [keyof TransactionFormValues, string][] = [
    ["transaction_date", "Date"],
    ["from_city_id", "From"],
    ["to_city_id", "To"],
    ["truck_id", "Truck"],
    ["driver_id", "Driver"],
    ["client_id", "Client"],
    ["broker_id", "Broker"],
    ["item_name", "Item"],
  ];
  for (const [key, label] of required) {
    if (!form[key]?.trim()) return `${label} is required.`;
  }

  const numericFields: [keyof TransactionFormValues, string][] = [
    ["quantity", "Quantity"],
    ["weight", "Weight"],
    ["weighing_bridge_cost", "Weighing Charges"],
    ["loading_labour_charges", "Labour Charges"],
    ["fare_charges", "Fare Amount"],
    ["extra_charges", "Misc"],
    ["advance_fare", "Advance Paid"],
    ["commission_amount", "Commission Amount"],
    ["commission_paid", "Commission Paid"],
  ];
  for (const [key, label] of numericFields) {
    const raw = form[key]?.trim();
    if (raw && (Number.isNaN(Number(raw)) || Number(raw) < 0)) {
      return `${label} must be a valid non-negative number.`;
    }
  }

  return null;
}

export function TransactionForm({
  mode,
  referenceData,
  initialValues,
  transactionId,
  onSaved,
  onCancel,
}: {
  mode: "create" | "edit" | "details";
  referenceData: TransactionFormReferenceData;
  initialValues?: TransactionFormValues;
  transactionId?: string;
  onSaved: (transactionId: string) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<TransactionFormValues>(
    initialValues ?? defaultTransactionFormValues(referenceData.cities),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Records created inline via the combobox's "+ Add new ..." action —
  // merged into the option lists below so they're immediately selectable,
  // without needing to refetch referenceData from the server.
  const [extraTrucks, setExtraTrucks] = useState<SimpleOption[]>([]);
  const [extraDrivers, setExtraDrivers] = useState<SimpleOption[]>([]);
  const [extraClients, setExtraClients] = useState<SimpleOption[]>([]);
  const [extraBrokers, setExtraBrokers] = useState<SimpleOption[]>([]);
  const [extraCities, setExtraCities] = useState<SimpleOption[]>([]);
  const [quickAdd, setQuickAdd] = useState<
    | { kind: "truck" | "driver" | "client" | "broker"; query: string }
    | { kind: "city"; query: string; target: "from" | "to" }
    | null
  >(null);

  const isDetails = mode === "details";

  function set<K extends keyof TransactionFormValues>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Looks up an active commission rate for From City -> To City and fills
  // Commission Amount and Commission Paid from it — or zeroes both out when
  // no rate exists for that route yet. Called explicitly from the From/To
  // onChange handlers (not a form-wide effect) so it only fires on an
  // actual user change — never clobbers an existing transaction's saved
  // commission values when the edit popup first loads.
  function applyCommissionForRoute(fromCityId: string, toCityId: string) {
    if (!fromCityId || !toCityId) return;

    const rate = referenceData.commissionRates.find(
      (r) => r.from_city_id === fromCityId && r.to_city_id === toCityId,
    );

    setForm((f) => ({
      ...f,
      commission_amount: rate ? String(rate.amount) : "0.00",
      commission_paid: rate ? String(rate.amount) : "0.00",
    }));
  }

  function closeQuickAdd() {
    setQuickAdd(null);
  }

  function handleTruckCreated(row: { id: string; truck_number: string }) {
    setExtraTrucks((prev) => [...prev, { id: row.id, label: row.truck_number }]);
    set("truck_id", row.id);
    closeQuickAdd();
  }

  function handleDriverCreated(row: {
    id: string;
    full_name: string;
    phone: string | null;
  }) {
    setExtraDrivers((prev) => [
      ...prev,
      { id: row.id, label: `${row.full_name}/${row.phone ?? "—"}`, displayLabel: row.full_name },
    ]);
    set("driver_id", row.id);
    closeQuickAdd();
  }

  function handleClientCreated(row: {
    id: string;
    full_name: string;
    phone: string | null;
  }) {
    setExtraClients((prev) => [
      ...prev,
      { id: row.id, label: `${row.full_name}/${row.phone ?? "—"}`, displayLabel: row.full_name },
    ]);
    set("client_id", row.id);
    closeQuickAdd();
  }

  function handleBrokerCreated(row: {
    id: string;
    full_name: string;
    phone: string | null;
  }) {
    setExtraBrokers((prev) => [
      ...prev,
      { id: row.id, label: `${row.full_name}/${row.phone ?? "—"}`, displayLabel: row.full_name },
    ]);
    set("broker_id", row.id);
    closeQuickAdd();
  }

  function handleCityCreated(row: { id: string; name: string }) {
    const target = quickAdd?.kind === "city" ? quickAdd.target : null;
    setExtraCities((prev) => [...prev, { id: row.id, label: row.name }]);
    if (target === "from") {
      set("from_city_id", row.id);
      applyCommissionForRoute(row.id, form.to_city_id);
    } else if (target === "to") {
      set("to_city_id", row.id);
      applyCommissionForRoute(form.from_city_id, row.id);
    }
    closeQuickAdd();
  }

  const cityOptions = [...referenceData.cities, ...extraCities];
  const careOfLocationOptions = withCurrentOption(
    referenceData.activeLocations,
    referenceData.allLocations,
    form.to_location_id,
  );
  const truckOptions = withCurrentOption(
    [...referenceData.activeTrucks, ...extraTrucks],
    [...referenceData.allTrucks, ...extraTrucks],
    form.truck_id,
  );
  const clientOptions = withCurrentOption(
    [...referenceData.activeClients, ...extraClients],
    [...referenceData.allClients, ...extraClients],
    form.client_id,
  );
  const brokerOptions = withCurrentOption(
    [...referenceData.activeBrokers, ...extraBrokers],
    [...referenceData.allBrokers, ...extraBrokers],
    form.broker_id,
  );

  // Trucks and drivers have no persistent association with each other, so
  // this is just the plain active-drivers list (no per-truck prioritizing).
  const driverOptions = withCurrentOption(
    [...referenceData.activeDrivers, ...extraDrivers],
    [...referenceData.allDrivers, ...extraDrivers],
    form.driver_id,
  );

  const totalAmount =
    toNumber(form.weighing_bridge_cost) +
    toNumber(form.loading_labour_charges) +
    toNumber(form.fare_charges) +
    toNumber(form.extra_charges);
  const fareBalance = totalAmount - toNumber(form.advance_fare);
  const commissionBalance =
    toNumber(form.commission_amount) - toNumber(form.commission_paid);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDetails) return;
    setError(null);

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const payload = {
      transaction_date: form.transaction_date,
      from_city_id: form.from_city_id,
      to_city_id: form.to_city_id,
      to_location_id: form.to_location_id || null,
      truck_id: form.truck_id,
      driver_id: form.driver_id,
      client_id: form.client_id,
      broker_id: form.broker_id,
      item_name: form.item_name.trim(),
      quantity: form.quantity.trim() ? toNumber(form.quantity) : null,
      weight: form.weight.trim() ? toNumber(form.weight) : null,
      weighing_bridge_cost: toNumber(form.weighing_bridge_cost),
      loading_labour_charges: toNumber(form.loading_labour_charges),
      fare_charges: toNumber(form.fare_charges),
      extra_charges: toNumber(form.extra_charges),
      advance_fare: toNumber(form.advance_fare),
      commission_amount: toNumber(form.commission_amount),
      commission_paid: toNumber(form.commission_paid),
    };

    const { data, error: saveError } =
      mode === "create"
        ? await supabase
            .from("transactions")
            .insert(payload)
            .select(TRANSACTION_COLUMNS)
            .single()
        : await supabase
            .from("transactions")
            .update(payload)
            .eq("id", transactionId as string)
            .select(TRANSACTION_COLUMNS)
            .single();

    setLoading(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    try {
      await ensureCommissionRate(
        form.from_city_id,
        form.to_city_id,
        toNumber(form.commission_amount),
      );
    } catch {
      // Best-effort — a failed commission-rate insert shouldn't block the
      // transaction save that already succeeded above.
    }

    onSaved((data as unknown as { id: string }).id);
  }

  const quickAddTitle =
    quickAdd?.kind === "truck"
      ? "New Truck"
      : quickAdd?.kind === "driver"
        ? "New Driver"
        : quickAdd?.kind === "client"
          ? "New Client"
          : quickAdd?.kind === "broker"
            ? "New Broker"
            : quickAdd?.kind === "city"
              ? "New City"
              : "";

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date
            </label>
            <input
              type="date"
              disabled={isDetails}
              value={form.transaction_date}
              onChange={(e) => set("transaction_date", e.target.value)}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Truck
            </label>
            <Combobox
              disabled={isDetails}
              options={truckOptions}
              value={form.truck_id}
              onChange={(id) => set("truck_id", id)}
              placeholder="Search truck..."
              onAddNew={
                isDetails
                  ? undefined
                  : (query) => setQuickAdd({ kind: "truck", query })
              }
              addNewLabel="truck"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Driver
            </label>
            <Combobox
              disabled={isDetails}
              options={driverOptions}
              value={form.driver_id}
              onChange={(id) => set("driver_id", id)}
              placeholder="Search driver..."
              onAddNew={
                isDetails
                  ? undefined
                  : (query) => setQuickAdd({ kind: "driver", query })
              }
              addNewLabel="driver"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              From
            </label>
            <Combobox
              disabled={isDetails}
              options={cityOptions}
              value={form.from_city_id}
              onChange={(id) => {
                set("from_city_id", id);
                applyCommissionForRoute(id, form.to_city_id);
              }}
              placeholder="Search city..."
              onAddNew={
                isDetails
                  ? undefined
                  : (query) => setQuickAdd({ kind: "city", query, target: "from" })
              }
              addNewLabel="city"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              To
            </label>
            <Combobox
              disabled={isDetails}
              options={cityOptions}
              value={form.to_city_id}
              onChange={(id) => {
                set("to_city_id", id);
                applyCommissionForRoute(form.from_city_id, id);
              }}
              placeholder="Search city..."
              onAddNew={
                isDetails
                  ? undefined
                  : (query) => setQuickAdd({ kind: "city", query, target: "to" })
              }
              addNewLabel="city"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Client
            </label>
            <Combobox
              disabled={isDetails}
              options={clientOptions}
              value={form.client_id}
              onChange={(id) => set("client_id", id)}
              placeholder="Search client..."
              onAddNew={
                isDetails
                  ? undefined
                  : (query) => setQuickAdd({ kind: "client", query })
              }
              addNewLabel="client"
            />
          </div>
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Item
            </label>
            <input
              disabled={isDetails}
              value={form.item_name}
              onChange={(e) => set("item_name", e.target.value)}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Weight (KG)
            </label>
            <input
              inputMode="decimal"
              disabled={isDetails}
              value={form.weight}
              onChange={(e) => set("weight", normalizeNumeric(e.target.value))}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Quantity
            </label>
            <input
              inputMode="decimal"
              disabled={isDetails}
              value={form.quantity}
              onChange={(e) => set("quantity", normalizeNumeric(e.target.value))}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Destination
            </label>
            <Combobox
              disabled={isDetails}
              options={careOfLocationOptions.map((l) => ({
                id: l.id,
                label: `${l.label} — ${l.cityLabel}`,
              }))}
              value={form.to_location_id}
              onChange={(id) => set("to_location_id", id)}
              placeholder="Search location..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Broker
            </label>
            <Combobox
              disabled={isDetails}
              options={brokerOptions}
              value={form.broker_id}
              onChange={(id) => set("broker_id", id)}
              placeholder="Search broker..."
              onAddNew={
                isDetails
                  ? undefined
                  : (query) => setQuickAdd({ kind: "broker", query })
              }
              addNewLabel="broker"
            />
          </div>
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Fare Amount
            </label>
            <input
              inputMode="decimal"
              disabled={isDetails}
              value={form.fare_charges}
              onChange={(e) => set("fare_charges", normalizeNumeric(e.target.value))}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Weighing Charges
            </label>
            <input
              inputMode="decimal"
              disabled={isDetails}
              value={form.weighing_bridge_cost}
              onChange={(e) =>
                set("weighing_bridge_cost", normalizeNumeric(e.target.value))
              }
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Labour Charges
            </label>
            <input
              inputMode="decimal"
              disabled={isDetails}
              value={form.loading_labour_charges}
              onChange={(e) =>
                set("loading_labour_charges", normalizeNumeric(e.target.value))
              }
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Misc
            </label>
            <input
              inputMode="decimal"
              disabled={isDetails}
              value={form.extra_charges}
              onChange={(e) => set("extra_charges", normalizeNumeric(e.target.value))}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Total Amount
            </label>
            <div
              className={`${inputClass} bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300`}
            >
              {formatMoney(totalAmount)}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Advance Paid
            </label>
            <input
              inputMode="decimal"
              disabled={isDetails}
              value={form.advance_fare}
              onChange={(e) => set("advance_fare", normalizeNumeric(e.target.value))}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Balance Amount
            </label>
            <div
              className={`${inputClass} bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300`}
            >
              {formatMoney(fareBalance)}
            </div>
          </div>
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Commission Amount
            </label>
            <input
              inputMode="decimal"
              disabled={isDetails}
              value={form.commission_amount}
              onChange={(e) =>
                set("commission_amount", normalizeNumeric(e.target.value))
              }
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Commission Paid
            </label>
            <input
              inputMode="decimal"
              disabled={isDetails}
              value={form.commission_paid}
              onFocus={(e) => {
                if (toNumber(form.commission_paid) === 0 && toNumber(form.commission_amount) !== 0) {
                  set("commission_paid", form.commission_amount);
                  requestAnimationFrame(() => e.target.select());
                }
              }}
              onChange={(e) =>
                set("commission_paid", normalizeNumeric(e.target.value))
              }
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Balance Commission
            </label>
            <div
              className={`${inputClass} bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300`}
            >
              {formatMoney(commissionBalance)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isDetails ? (
            onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={secondaryButtonClass}
              >
                <ArrowLeftIcon />
                Back
              </button>
            )
          ) : (
            <>
              <button type="submit" disabled={loading} className={primaryButtonClass}>
                {loading
                  ? "Saving..."
                  : mode === "create"
                    ? "Create Transaction"
                    : "Save Changes"}
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
              )}
            </>
          )}
          {error && (
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          )}
        </div>
      </form>

      <Modal open={quickAdd !== null} onClose={closeQuickAdd} title={quickAddTitle}>
        {quickAdd?.kind === "truck" && (
          <QuickAddTruck
            initialValue={quickAdd.query}
            onCreated={handleTruckCreated}
            onCancel={closeQuickAdd}
          />
        )}
        {quickAdd?.kind === "driver" && (
          <QuickAddDriver
            initialValue={quickAdd.query}
            onCreated={handleDriverCreated}
            onCancel={closeQuickAdd}
          />
        )}
        {quickAdd?.kind === "client" && (
          <QuickAddClient
            initialValue={quickAdd.query}
            onCreated={handleClientCreated}
            onCancel={closeQuickAdd}
          />
        )}
        {quickAdd?.kind === "broker" && (
          <QuickAddBroker
            initialValue={quickAdd.query}
            onCreated={handleBrokerCreated}
            onCancel={closeQuickAdd}
          />
        )}
        {quickAdd?.kind === "city" && (
          <QuickAddCity
            initialValue={quickAdd.query}
            onCreated={handleCityCreated}
            onCancel={closeQuickAdd}
          />
        )}
      </Modal>
    </>
  );
}
