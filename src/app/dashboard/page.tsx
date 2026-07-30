import { getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClientWaitlistManager, type ClientWaitlistRow } from "./client-waitlist-manager";
import { TruckWaitlistManager, type TruckWaitlistRow } from "./truck-waitlist-manager";
import { TopFivePanel, type TopFiveTransaction } from "./top-five-panel";
import {
  PendingCommissionList,
  type PendingCommissionRow,
} from "./pending-commission-list";
import {
  PeriodSummaryTabs,
  type SummaryExpense,
  type SummaryTransaction,
} from "./period-summary-tabs";
import { CLIENT_WAITLIST_COLUMNS, TRUCK_WAITLIST_COLUMNS } from "./waitlist-shared";

export default async function DashboardPage() {
  const profile = await getUserProfile();

  // DashboardLayout already redirects/blocks unauthenticated or role-less
  // users before this renders; profile is guaranteed here.
  if (!profile) return null;

  const supabase = await createClient();

  const [
    { data: clientWaitlist },
    { data: truckWaitlist },
    { data: cities },
    { data: clients },
    { data: trucks },
    { data: drivers },
    { data: transactions },
    { data: pendingCommission },
    { data: expenses },
  ] = await Promise.all([
    supabase.from("client_waitlist").select(CLIENT_WAITLIST_COLUMNS),
    supabase.from("truck_waitlist").select(TRUCK_WAITLIST_COLUMNS),
    supabase.from("cities").select("id, name").order("name", { ascending: true }),
    supabase.from("clients").select("id, full_name, phone, is_active"),
    supabase.from("trucks").select("id, truck_number, is_active"),
    supabase.from("drivers").select("id, full_name, phone, is_active"),
    // Backs both the Top 5 rankings and the period summary cards.
    supabase
      .from("transactions")
      .select(
        "transaction_date, truck_id, driver_id, client_id, " +
          "commission_amount, commission_discount",
      )
      .eq("is_voided", false),
    supabase
      .from("transactions")
      .select(
        "id, transaction_number, transaction_date, driver_id, truck_id, " +
          "commission_amount, commission_paid, commission_discount, " +
          "commission_balance, commission_received_by",
      )
      .eq("is_voided", false)
      .gt("commission_balance", 0),
    supabase.from("expenses").select("expense_date, amount"),
  ]);

  const cityOptions = (cities ?? []).map((c) => ({ id: c.id, label: c.name }));

  const toNameOption = (row: { id: string; full_name: string; phone: string | null }) => ({
    id: row.id,
    label: `${row.full_name}/${row.phone ?? "—"}`,
    displayLabel: row.full_name,
  });

  // "all" lists label the Top 5 rankings, since a top-ranked truck/driver/
  // client may have been deactivated since those transactions were made.
  // The waitlist comboboxes only offer the active ones.
  const allClientOptions = (clients ?? []).map(toNameOption);
  const allDriverOptions = (drivers ?? []).map(toNameOption);
  const allTruckOptions = (trucks ?? []).map((t) => ({
    id: t.id,
    label: t.truck_number,
  }));

  const clientOptions = (clients ?? []).filter((c) => c.is_active).map(toNameOption);
  const driverOptions = (drivers ?? []).filter((d) => d.is_active).map(toNameOption);
  const truckOptions = (trucks ?? [])
    .filter((t) => t.is_active)
    .map((t) => ({ id: t.id, label: t.truck_number }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Banner-Txt.png"
        alt="GeoIhsan — Goods Transport Company"
        className="block h-auto w-full rounded-lg object-cover"
      />

      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Welcome, {profile.full_name ?? "there"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Role: {profile.role}
        </p>
      </div>

      <PeriodSummaryTabs
        transactions={(transactions ?? []) as unknown as SummaryTransaction[]}
        expenses={(expenses ?? []) as unknown as SummaryExpense[]}
      />

      <TopFivePanel
        transactions={(transactions ?? []) as unknown as TopFiveTransaction[]}
        truckOptions={allTruckOptions}
        driverOptions={allDriverOptions}
        clientOptions={allClientOptions}
      />

      <PendingCommissionList
        initialRows={(pendingCommission ?? []) as unknown as PendingCommissionRow[]}
        driverOptions={allDriverOptions}
        truckOptions={allTruckOptions}
      />

      {/* Side by side once there's room — the trimmed columns fit two grids
          across without scrolling. */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ClientWaitlistManager
          initialRows={(clientWaitlist ?? []) as unknown as ClientWaitlistRow[]}
          cityOptions={cityOptions}
          clientOptions={clientOptions}
        />

        <TruckWaitlistManager
          initialRows={(truckWaitlist ?? []) as unknown as TruckWaitlistRow[]}
          cityOptions={cityOptions}
          truckOptions={truckOptions}
          driverOptions={driverOptions}
        />
      </div>
    </div>
  );
}
