import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { LogoutButton } from "./logout-button";
import { DashboardShell, type NavLink } from "./_components/DashboardShell";

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/trucks", label: "Trucks" },
  { href: "/dashboard/drivers", label: "Drivers" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/cities", label: "Cities" },
  { href: "/dashboard/locations", label: "Locations" },
  { href: "/dashboard/brokers", label: "Brokers" },
];

const ADMIN_ONLY_NAV_LINKS: NavLink[] = [
  { href: "/dashboard/commission", label: "Commission" },
  { href: "/dashboard/settings", label: "Settings" },
];

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

  const navLinks =
    profile.role === "admin" ? [...NAV_LINKS, ...ADMIN_ONLY_NAV_LINKS] : NAV_LINKS;

  return <DashboardShell navLinks={navLinks}>{children}</DashboardShell>;
}
