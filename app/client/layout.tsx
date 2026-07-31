"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardList,
  House,
  Receipt,
  UserRound,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { getMyClientProfile } from "@/lib/api";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = useQuery({
    queryKey: ["client-profile"],
    queryFn: getMyClientProfile,
  });
  const nav: NavItem[] = [
    { href: "/client", label: "Home", icon: House },
    ...(profile.data?.canViewShifts
      ? [
          { href: "/client/schedule", label: "Schedule", icon: CalendarDays },
          { href: "/client/shifts", label: "My shifts", icon: ClipboardList },
        ]
      : []),
    { href: "/client/billing", label: "Billing", icon: Receipt },
    { href: "/client/profile", label: "Profile", icon: UserRound },
  ];

  return (
    <RoleGuard allow={["CLIENT"]}>
      <AppShell role="CLIENT" nav={nav}>
        {children}
      </AppShell>
    </RoleGuard>
  );
}
