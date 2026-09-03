"use client";

import {
  Building2,
  CalendarDays,
  ClipboardList,
  House,
  Link2,
  Receipt,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";

const NAV = [
  { href: "/facility", label: "Home", icon: House },
  { href: "/facility/agencies", label: "Agencies", icon: Link2 },
  { href: "/facility/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/facility/shifts", label: "Shift board", icon: ClipboardList },
  { href: "/facility/billing", label: "Billing", icon: Receipt },
  { href: "/facility/profile", label: "Profile", icon: UserRound },
];

export default function FacilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["FACILITY"]}>
      <AppShell role="FACILITY" nav={NAV}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
