"use client";

import {
  CalendarDays,
  ClipboardList,
  FileBarChart2,
  House,
  Link2,
  Settings,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";

const NAV = [
  { href: "/agency", label: "Overview", icon: House },
  { href: "/agency/shift-requests", label: "Shift requests", icon: ClipboardList },
  { href: "/agency/schedule", label: "Home schedules", icon: CalendarDays },
  { href: "/agency/shifts", label: "Shifts", icon: ClipboardList },
  { href: "/agency/roster", label: "Roster", icon: Users },
  { href: "/agency/connections", label: "Home connections", icon: Link2 },
  { href: "/agency/reports", label: "Reports", icon: FileBarChart2 },
  { href: "/agency/settings", label: "Settings", icon: Settings },
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
