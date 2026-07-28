import { createClient } from "@/lib/supabase/server";
import { BrokersManager } from "./brokers-manager";

export default async function BrokersPage() {
  const supabase = await createClient();

  const { data: brokers } = await supabase
    .from("brokers")
    .select("id, full_name, phone, whatsapp, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Brokers
      </h1>
      <BrokersManager initialBrokers={brokers ?? []} />
    </div>
  );
}
