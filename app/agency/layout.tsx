"use client";

import {
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  House,
  Link2,
  Radio,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";

const NAV = [
  { href: "/agency", label: "Overview", icon: House },
  { href: "/agency/shift-requests", label: "Shift requests", icon: ClipboardList },
  { href: "/agency/schedule", label: "Home schedules", icon: CalendarDays },
  { href: "/agency/shifts", label: "Shifts", icon: ClipboardList },
  { href: "/agency/staffing", label: "Staffing", icon: Radio },
  { href: "/agency/roster", label: "Roster", icon: Users },
  { href: "/agency/connections", label: "Home connections", icon: Link2 },
  { href: "/agency/rates", label: "Rates", icon: Wallet },
  { href: "/agency/invoices", label: "Invoices", icon: Receipt },
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
