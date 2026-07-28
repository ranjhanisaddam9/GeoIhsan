import { getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CommissionManager } from "./commission-manager";

export default async function CommissionPage() {
  const profile = await getUserProfile();

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-zinc-50 px-6 text-center dark:bg-black">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Access Denied
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Only admins can view commission rates.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: cities }, { data: commissionRates }] = await Promise.all([
    supabase.from("cities").select("id, name").order("name", { ascending: true }),
    supabase
      .from("commission_rates")
      .select("id, from_city_id, to_city_id, amount, is_active, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const cityOptions = (cities ?? []).map((c) => ({ id: c.id, label: c.name }));

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Commission
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Adding a new rate for a route automatically expires the previous
        active rate for that same route — past rates are kept, not
        overwritten, so they stay attached to whatever transactions used
        them.
      </p>
      <CommissionManager
        initialRates={commissionRates ?? []}
        cityOptions={cityOptions}
      />
    </div>
  );
}
