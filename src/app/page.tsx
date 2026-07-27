import { createClient } from "@/lib/supabase/server";

async function getSupabaseStatus() {
  try {
    const supabase = await createClient();
    // No tables exist yet — this only verifies the client initializes.
    if (!supabase) throw new Error("Supabase client did not initialize");
    return { ok: true, message: "Supabase client initialized successfully." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unknown Supabase init error",
    };
  }
}

export default async function Home() {
  const supabaseStatus = await getSupabaseStatus();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-6 px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          GeoIhsan — Trucking Station Management System
        </h1>
        <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
          Phase 1 Setup Complete
        </p>

        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            supabaseStatus.ok
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
          }`}
        >
          Supabase connection check: {supabaseStatus.message}
        </div>
      </main>
    </div>
  );
}
