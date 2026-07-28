import { createClient } from "@/lib/supabase/server";

export type SimpleOption = { id: string; label: string; displayLabel?: string };
export type LocationOption = SimpleOption & { cityLabel: string };
export type CommissionRateOption = {
  from_city_id: string;
  to_city_id: string;
  amount: number;
};

export type TransactionFormReferenceData = {
  cities: SimpleOption[];
  activeLocations: LocationOption[];
  allLocations: LocationOption[];
  activeTrucks: SimpleOption[];
  allTrucks: SimpleOption[];
  activeDrivers: SimpleOption[];
  allDrivers: SimpleOption[];
  activeClients: SimpleOption[];
  allClients: SimpleOption[];
  activeBrokers: SimpleOption[];
  allBrokers: SimpleOption[];
  commissionRates: CommissionRateOption[];
};

// Shared by the Transactions list page's Add/Edit/Details modals so they
// all pull dropdown options the same way instead of duplicating these queries.
// "active" lists back the selectable options in the form; "all" lists let
// the form still display/keep a value that points at a since-deactivated
// row (e.g. editing an old transaction whose truck was later retired).
export async function getTransactionFormReferenceData(): Promise<TransactionFormReferenceData> {
  const supabase = await createClient();

  const [
    { data: locations },
    { data: cities },
    { data: trucks },
    { data: drivers },
    { data: clients },
    { data: brokers },
    { data: commissionRateRows },
  ] = await Promise.all([
    supabase.from("locations").select("id, name, city_id, is_active"),
    supabase.from("cities").select("id, name").order("name", { ascending: true }),
    supabase.from("trucks").select("id, truck_number, is_active"),
    supabase.from("drivers").select("id, full_name, phone, is_active"),
    supabase.from("clients").select("id, full_name, phone, is_active"),
    supabase.from("brokers").select("id, full_name, phone, is_active"),
    supabase
      .from("commission_rates")
      .select("from_city_id, to_city_id, amount")
      .eq("is_active", true),
  ]);

  const cityNameById = new Map((cities ?? []).map((c) => [c.id, c.name]));
  const cityOptions = (cities ?? []).map((c) => ({ id: c.id, label: c.name }));

  const toLocationOption = (l: {
    id: string;
    name: string;
    city_id: string;
  }): LocationOption => ({
    id: l.id,
    label: l.name,
    cityLabel: cityNameById.get(l.city_id) ?? "—",
  });

  const allLocations = (locations ?? []).map(toLocationOption);
  const activeLocations = (locations ?? [])
    .filter((l) => l.is_active)
    .map(toLocationOption);

  const allTrucks = (trucks ?? []).map((t) => ({
    id: t.id,
    label: t.truck_number,
  }));
  const activeTrucks = (trucks ?? [])
    .filter((t) => t.is_active)
    .map((t) => ({ id: t.id, label: t.truck_number }));

  // Shown in the dropdown as "Name/Mobile" (two people can share a name),
  // but only the name appears once an option is actually selected.
  function toNameMobileOption(row: {
    id: string;
    full_name: string;
    phone: string | null;
  }): SimpleOption {
    return {
      id: row.id,
      label: `${row.full_name}/${row.phone ?? "—"}`,
      displayLabel: row.full_name,
    };
  }

  const allDrivers = (drivers ?? []).map(toNameMobileOption);
  const activeDrivers = (drivers ?? []).filter((d) => d.is_active).map(toNameMobileOption);

  const allClients = (clients ?? []).map(toNameMobileOption);
  const activeClients = (clients ?? []).filter((c) => c.is_active).map(toNameMobileOption);

  const allBrokers = (brokers ?? []).map(toNameMobileOption);
  const activeBrokers = (brokers ?? []).filter((b) => b.is_active).map(toNameMobileOption);

  return {
    cities: cityOptions,
    activeLocations,
    allLocations,
    activeTrucks,
    allTrucks,
    activeDrivers,
    allDrivers,
    activeClients,
    allClients,
    activeBrokers,
    allBrokers,
    commissionRates: commissionRateRows ?? [],
  };
}
