import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReceiptView } from "./receipt-view";
import { isReceiptLanguage } from "./receipt-labels";

const RECEIPT_COLUMNS =
  "id, transaction_number, transaction_date, from_city_id, to_city_id, to_location_id, " +
  "truck_id, driver_id, client_id, broker_id, item_name, quantity, weight, " +
  "weighing_bridge_cost, loading_labour_charges, fare_charges, extra_charges, " +
  "total_fare_charges, advance_fare, remaining_fare, is_voided";

type ReceiptTransactionRow = {
  id: string;
  transaction_number: string;
  transaction_date: string;
  from_city_id: string;
  to_city_id: string;
  to_location_id: string | null;
  truck_id: string;
  driver_id: string;
  client_id: string;
  broker_id: string;
  item_name: string;
  quantity: number | null;
  weight: number | null;
  weighing_bridge_cost: number;
  loading_labour_charges: number;
  fare_charges: number;
  extra_charges: number;
  total_fare_charges: number;
  advance_fare: number;
  remaining_fare: number;
  is_voided: boolean;
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: transactionData } = await supabase
    .from("transactions")
    .select(RECEIPT_COLUMNS)
    .eq("id", id)
    .single();

  if (!transactionData) notFound();

  const transaction = transactionData as unknown as ReceiptTransactionRow;

  const [
    { data: fromCity },
    { data: toCity },
    { data: toLocation },
    { data: truck },
    { data: driver },
    { data: client },
    { data: broker },
  ] = await Promise.all([
    supabase.from("cities").select("name").eq("id", transaction.from_city_id).single(),
    supabase.from("cities").select("name").eq("id", transaction.to_city_id).single(),
    transaction.to_location_id
      ? supabase
          .from("locations")
          .select("name, address, city_id")
          .eq("id", transaction.to_location_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase.from("trucks").select("truck_number").eq("id", transaction.truck_id).single(),
    supabase.from("drivers").select("full_name, phone").eq("id", transaction.driver_id).single(),
    supabase.from("clients").select("full_name").eq("id", transaction.client_id).single(),
    supabase.from("brokers").select("full_name, phone").eq("id", transaction.broker_id).single(),
  ]);

  let destinationCityName: string | null = null;
  if (toLocation?.city_id) {
    const { data: destCity } = await supabase
      .from("cities")
      .select("name")
      .eq("id", toLocation.city_id)
      .single();
    destinationCityName = destCity?.name ?? null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let printedByUsername = "—";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    printedByUsername = profile?.username ?? "—";
  }

  const { data: languageSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "receipt_language")
    .single();
  const language = isReceiptLanguage(languageSetting?.value) ? languageSetting.value : "english";

  return (
    <ReceiptView
      transaction={transaction}
      printedByUsername={printedByUsername}
      language={language}
      fromCityName={fromCity?.name ?? "—"}
      toCityName={toCity?.name ?? "—"}
      destinationLocationName={toLocation?.name ?? null}
      destinationAddress={toLocation?.address ?? null}
      destinationCityName={destinationCityName}
      truckNumber={truck?.truck_number ?? "—"}
      driverName={driver?.full_name ?? "—"}
      driverPhone={driver?.phone ?? null}
      clientName={client?.full_name ?? "—"}
      brokerName={broker?.full_name ?? "—"}
      brokerPhone={broker?.phone ?? null}
    />
  );
}
