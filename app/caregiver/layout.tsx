"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { getMyCaregiverProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function CaregiverShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pending = user?.status === "PENDING_REVIEW";
  const profile = useQuery({
    queryKey: ["caregiver-me"],
    queryFn: getMyCaregiverProfile,
  });

  const independentOn = profile.data?.independentShiftsEnabled !== false;
  const agencyOn = profile.data?.agencyRosterEnabled !== false;

  const nav = useMemo(() => {
    if (pending) {
      return [
        { href: "/pending-review", label: "Application", icon: ClipboardList },
        ...(agencyOn
          ? [
              { href: "/caregiver/rosters", label: "My Agencies", icon: Users },
              {
                href: "/caregiver/find-agencies",
                label: "Find agencies",
                icon: Search,
              },
            ]
          : []),
        { href: "/caregiver/my-shifts", label: "My shifts", icon: CalendarCheck2 },
      ];
    }
    return [
      { href: "/caregiver", label: "Home", icon: House },
      ...(agencyOn
        ? [
            { href: "/caregiver/rosters", label: "My Agencies", icon: Users },
            {
              href: "/caregiver/find-agencies",
              label: "Find agencies",
              icon: Search,
            },
          ]
        : []),
      ...(independentOn || agencyOn
        ? [
            {
              href: "/caregiver/shifts",
              label: "Open shifts",
              icon: CalendarSearch,
            },
          ]
        : []),
      { href: "/caregiver/my-shifts", label: "My shifts", icon: CalendarCheck2 },
      { href: "/caregiver/pay", label: "Pay", icon: Banknote },
      { href: "/caregiver/profile", label: "Profile", icon: UserRound },
    ];
  }, [pending, independentOn, agencyOn]);

  return (
    <AppShell role="CAREGIVER" nav={nav}>
      {pending ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your account is under OkayNow review. You can still view your
          agencies, apply to hiring agencies, accept invites, and clock in or
          out on assigned shifts.
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
