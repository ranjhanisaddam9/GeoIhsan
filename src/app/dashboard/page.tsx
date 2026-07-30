import { getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClientWaitlistManager, type ClientWaitlistRow } from "./client-waitlist-manager";
import { TruckWaitlistManager, type TruckWaitlistRow } from "./truck-waitlist-manager";
import { TopFivePanel, type TopFiveTransaction } from "./top-five-panel";
import {
  PendingCommissionList,
  type PendingCommissionRow,
} from "./pending-commission-list";
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
  ] = await Promise.all([
    supabase.from("client_waitlist").select(CLIENT_WAITLIST_COLUMNS),
    supabase.from("truck_waitlist").select(TRUCK_WAITLIST_COLUMNS),
    supabase.from("cities").select("id, name").order("name", { ascending: true }),
    supabase.from("clients").select("id, full_name, phone, is_active"),
    supabase.from("trucks").select("id, truck_number, is_active"),
    supabase.from("drivers").select("id, full_name, phone, is_active"),
    supabase
      .from("transactions")
      .select("transaction_date, truck_id, driver_id, client_id")
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
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Welcome, {profile.full_name ?? "there"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Role: {profile.role}
        </p>
      </div>

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
  );
}
