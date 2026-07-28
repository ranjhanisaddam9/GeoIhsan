"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryButtonClass } from "./ui";
import { LogoutButton } from "../logout-button";

export type NavLink = { href: string; label: string };

function isActiveLink(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  navLinks,
  children,
}: {
  navLinks: NavLink[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Default to open (matches the no-JS/SSR render), but collapse on small
  // screens once we know the real viewport. Deliberately runs post-mount
  // rather than via a lazy useState initializer: reading window during the
  // initial client render would diverge from the server-rendered "open"
  // output and trigger a genuine hydration mismatch, not just a lint nag.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.matchMedia("(max-width: 1023px)").matches) setSidebarOpen(false);
  }, []);

  function closeIfMobile() {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setSidebarOpen(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-950 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <span className="text-lg font-semibold text-green-700 dark:text-green-400">
            GeoIhsan
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {navLinks.map((link) => {
            const active = isActiveLink(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeIfMobile}
                className={
                  active
                    ? "rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
                    : "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/transactions"
              className={`${primaryButtonClass} whitespace-nowrap`}
            >
              <span className="hidden sm:inline">+ New Transaction</span>
              <span className="sm:hidden">+ New</span>
            </Link>
            <LogoutButton />
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
