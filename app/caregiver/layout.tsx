"use client";

import {
  Banknote,
  CalendarCheck2,
  CalendarSearch,
  ClipboardList,
  House,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { useAuth } from "@/lib/auth-context";

const FULL_NAV = [
  { href: "/caregiver", label: "Home", icon: House },
  { href: "/caregiver/rosters", label: "My rosters", icon: Users },
  { href: "/caregiver/find-agencies", label: "Find agencies", icon: Search },
  { href: "/caregiver/shifts", label: "Open shifts", icon: CalendarSearch },
  { href: "/caregiver/my-shifts", label: "My shifts", icon: CalendarCheck2 },
  { href: "/caregiver/pay", label: "Pay", icon: Banknote },
  { href: "/caregiver/profile", label: "Profile", icon: UserRound },
];

const PENDING_NAV = [
  { href: "/pending-review", label: "Application", icon: ClipboardList },
  { href: "/caregiver/rosters", label: "My rosters", icon: Users },
  { href: "/caregiver/find-agencies", label: "Find agencies", icon: Search },
  { href: "/caregiver/my-shifts", label: "My shifts", icon: CalendarCheck2 },
];

function CaregiverShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pending = user?.status === "PENDING_REVIEW";
  return (
    <AppShell role="CAREGIVER" nav={pending ? PENDING_NAV : FULL_NAV}>
      {pending ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your account is under agency review. You can still view your rosters,
          apply to hiring agencies, accept invites, and clock in or out on
          assigned shifts.
        </div>
      ) : null}
      {children}
    </AppShell>
  );
}

export default function CaregiverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allow={["CAREGIVER"]}>
      <CaregiverShell>{children}</CaregiverShell>
    </RoleGuard>
  );
}
