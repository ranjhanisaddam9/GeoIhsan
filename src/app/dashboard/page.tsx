import { getUserProfile } from "@/lib/auth";

export default async function DashboardPage() {
  const profile = await getUserProfile();

  // DashboardLayout already redirects/blocks unauthenticated or role-less
  // users before this renders; profile is guaranteed here.
  if (!profile) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Welcome, {profile.full_name ?? "there"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Role: {profile.role}
        </p>
      </div>

      {profile.role === "admin" && (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          Manager Management (coming in Phase 3)
        </div>
      )}
    </div>
  );
}
