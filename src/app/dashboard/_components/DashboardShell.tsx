"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryButtonClass } from "./ui";
import { ChevronDownIcon } from "./icons";
import { LogoutButton } from "../logout-button";

export type NavChildLink = { href: string; label: string };

// A nav entry is either a plain link or, when it has children, a collapsible
// group whose own href is only used to tell whether the group is active.
export type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  children?: NavChildLink[];
};

function isActiveLink(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkBaseClass = "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-bold";
const activeLinkClass = `${linkBaseClass} bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300`;
const idleLinkClass = `${linkBaseClass} text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50`;

export function DashboardShell({
  navLinks,
  children,
}: {
  navLinks: NavLink[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Only holds groups the user has explicitly toggled; the rest fall back to
  // "open if you're inside them".
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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
          className="fixed inset-0 z-40 bg-black/40 lg:hidden print:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-zinc-200 bg-white transition-transform duration-200 print:hidden dark:border-zinc-800 dark:bg-zinc-950 lg:relative lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat opacity-50"
          style={{ backgroundImage: "url('/sidepanel.png')" }}
        />
        <div className="relative flex items-center justify-center border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/log0.png"
            alt="GeoIhsan"
            className="w-auto"
            style={{ height: "clamp(2.5rem, -0.5rem + 11.5vw, 10rem)" }}
          />
        </div>
        <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {navLinks.map((link) => {
            const active = isActiveLink(pathname, link.href);

            if (!link.children) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeIfMobile}
                  className={active ? activeLinkClass : idleLinkClass}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            }

            // Groups stay open while you're inside them, and can be toggled
            // otherwise.
            const expanded = openGroups[link.href] ?? active;
            return (
              <div key={link.href} className="flex flex-col gap-1">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setOpenGroups((prev) => ({ ...prev, [link.href]: !expanded }))
                  }
                  className={`${active ? activeLinkClass : idleLinkClass} w-full text-left`}
                >
                  {link.icon}
                  <span className="flex-1">{link.label}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 transition-transform ${
                      expanded ? "" : "-rotate-90"
                    }`}
                  />
                </button>
                {expanded && (
                  <div className="flex flex-col gap-1 ps-7">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={closeIfMobile}
                        className={
                          isActiveLink(pathname, child.href)
                            ? "rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                        }
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header
          className="flex items-center justify-between border-b border-zinc-200 bg-white bg-repeat-y px-4 py-3 print:hidden dark:border-zinc-800 dark:bg-zinc-950 sm:px-6"
          style={{ backgroundImage: "url('/header.png')", backgroundSize: "100% auto" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              className="shrink-0 rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
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
            <span className="hidden text-lg font-semibold tracking-wide text-white sm:inline md:hidden">
              Geo Ihsan
            </span>
            <span className="hidden truncate text-2xl font-semibold tracking-wide text-white md:inline">
              Geo Ihsan Goods Transport Company
            </span>
          </div>
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
