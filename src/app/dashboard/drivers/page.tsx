import { createClient } from "@/lib/supabase/server";
import { DriversManager } from "./drivers-manager";

export default async function DriversPage() {
  const supabase = await createClient();

  const { data: drivers } = await supabase
    .from("drivers")
    .select(
      "id, full_name, father_name, cnic, phone, whatsapp, care_of_details, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Drivers
      </h1>
      <DriversManager initialDrivers={drivers ?? []} />
    </div>
  );
}
