import { createClient } from "@/lib/supabase/server";
import { CitiesManager } from "./cities-manager";

export default async function CitiesPage() {
  const supabase = await createClient();
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Cities
      </h1>
      <CitiesManager initialCities={cities ?? []} />
    </div>
  );
}
