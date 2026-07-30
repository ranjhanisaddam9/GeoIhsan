import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { LogoutButton } from "./logout-button";
import { DashboardShell, type NavLink } from "./_components/DashboardShell";
import {
  BriefcaseIcon,
  BuildingIcon,
  ChartBarIcon,
  ClipboardListIcon,
  CogIcon,
  HomeIcon,
  MapPinIcon,
  PercentIcon,
  TruckIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from "./_components/icons";

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: <HomeIcon /> },
  { href: "/dashboard/transactions", label: "Transactions", icon: <ClipboardListIcon /> },
  { href: "/dashboard/trucks", label: "Trucks", icon: <TruckIcon /> },
  { href: "/dashboard/drivers", label: "Drivers", icon: <UserIcon /> },
  { href: "/dashboard/clients", label: "Clients", icon: <UsersIcon /> },
  { href: "/dashboard/cities", label: "Cities", icon: <BuildingIcon /> },
  { href: "/dashboard/locations", label: "Locations", icon: <MapPinIcon /> },
  { href: "/dashboard/brokers", label: "Brokers", icon: <BriefcaseIcon /> },
  { href: "/dashboard/expenses", label: "Expenses", icon: <WalletIcon /> },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: <ChartBarIcon />,
    children: [
      {
        href: "/dashboard/reports/income-statement",
        label: "Income Statement Report",
      },
    ],
  },
];

const ADMIN_ONLY_NAV_LINKS: NavLink[] = [
  { href: "/dashboard/commission", label: "Commission", icon: <PercentIcon /> },
  { href: "/dashboard/settings", label: "Settings", icon: <CogIcon /> },
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
