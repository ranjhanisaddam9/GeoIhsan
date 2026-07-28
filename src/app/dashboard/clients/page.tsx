import { createClient } from "@/lib/supabase/server";
import { ClientsManager } from "./clients-manager";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, phone, whatsapp, address, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Clients
      </h1>
      <ClientsManager initialClients={clients ?? []} />
    </div>
  );
}
