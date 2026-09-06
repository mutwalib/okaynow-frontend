"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

const TABS = [
  { href: "/agency/settings", label: "Directory", match: (p: string) => p === "/agency/settings" },
  { href: "/agency/settings/rates", label: "Rates", match: (p: string) => p.startsWith("/agency/settings/rates") },
  { href: "/agency/settings/staffing", label: "Staffing", match: (p: string) => p.startsWith("/agency/settings/staffing") },
  { href: "/agency/settings/billing", label: "Billing", match: (p: string) => p.startsWith("/agency/settings/billing") },
  { href: "/agency/settings/invoices", label: "Invoices", match: (p: string) => p.startsWith("/agency/settings/invoices") },
] as const;

export default function AgencySettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="inline-flex items-center gap-2 font-display text-3xl text-ink">
          <Settings className="h-7 w-7 text-brand" aria-hidden />
          Settings
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Directory profile, rates, staffing rules, subscription billing, and
          client invoices.
        </p>
      </div>

      <nav
        className="flex flex-wrap gap-1 border-b border-line"
        aria-label="Settings sections"
      >
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-brand text-ink"
                  : "border-transparent text-ink-muted hover:border-line hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
