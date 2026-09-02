"use client";

import {
  Building2,
  CreditCard,
  House,
  Link2,
  Settings,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";

const NAV = [
  { href: "/agency", label: "Overview", icon: House },
  { href: "/agency/connections", label: "Home connections", icon: Link2 },
  { href: "/agency/billing", label: "Billing", icon: CreditCard },
  { href: "/agency/settings", label: "Directory profile", icon: Settings },
];

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["AGENCY_ADMIN"]}>
      <AppShell role="AGENCY_ADMIN" nav={NAV}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
