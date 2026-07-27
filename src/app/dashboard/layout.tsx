import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserProfile } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();

  // Proxy already blocks unauthenticated requests to /dashboard; this is a
  // defensive fallback (e.g. profile row missing or session raced).
  if (!profile) {
    redirect("/login");
  }

  if (!profile.role) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
        <p className="max-w-sm text-zinc-700 dark:text-zinc-300">
          Waiting for admin to assign your role.
        </p>
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-black dark:text-zinc-50">
              GeoIhsan
            </span>
            <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <Link
                href="/dashboard"
                className="hover:text-black dark:hover:text-zinc-50"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/trucks"
                className="hover:text-black dark:hover:text-zinc-50"
              >
                Trucks
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
