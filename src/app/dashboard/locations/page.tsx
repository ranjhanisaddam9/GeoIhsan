import { createClient } from "@/lib/supabase/server";
import { LocationsManager } from "./locations-manager";

export default async function LocationsPage() {
  const supabase = await createClient();
  const [{ data: locations }, { data: cities }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, address, city_id, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("cities").select("id, name").order("name", { ascending: true }),
  ]);

  const cityOptions = (cities ?? []).map((c) => ({ id: c.id, label: c.name }));

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Locations
      </h1>
      <LocationsManager
        initialLocations={locations ?? []}
        cityOptions={cityOptions}
      />
    </div>
  );
}
