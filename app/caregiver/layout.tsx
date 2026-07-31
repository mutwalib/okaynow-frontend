"use client";

import {
  Banknote,
  CalendarCheck2,
  CalendarSearch,
  House,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";

const NAV = [
  { href: "/caregiver", label: "Home", icon: House },
  { href: "/caregiver/shifts", label: "Open shifts", icon: CalendarSearch },
  { href: "/caregiver/my-shifts", label: "My shifts", icon: CalendarCheck2 },
  { href: "/caregiver/pay", label: "Pay", icon: Banknote },
  { href: "/caregiver/profile", label: "Profile", icon: UserRound },
];

export default function CaregiverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["CAREGIVER"]}>
      <AppShell role="CAREGIVER" nav={NAV}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
