import { createClient } from "@/lib/supabase/server";
import { TrucksManager } from "./trucks-manager";

export default async function TrucksPage() {
  const supabase = await createClient();

  const { data: trucks } = await supabase
    .from("trucks")
    .select("id, truck_number, truck_type, capacity, owner_details, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Trucks
      </h1>
      <TrucksManager initialTrucks={trucks ?? []} />
    </div>
  );
}
