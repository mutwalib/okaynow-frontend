"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Building2, Search, UserRound } from "lucide-react";
import {
  getCaregiverAgencyOpenShifts,
  getMyCaregiverProfile,
  getShifts,
} from "@/lib/api";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingBlock, ShiftCard } from "@/components/shift-card";
import { MOCK_SHIFTS } from "@/lib/mockShifts";
import type { Shift } from "@/lib/types";

export default function CaregiverHomePage() {
  const profile = useQuery({
    queryKey: ["caregiver-me"],
    queryFn: getMyCaregiverProfile,
    retry: false,
  });

  const independentOn = profile.data?.independentShiftsEnabled !== false;
  const agencyOn = profile.data?.agencyRosterEnabled !== false;
  const showOpen = independentOn || agencyOn;

  const marketplace = useQuery({
    queryKey: ["shifts-open-preview"],
    queryFn: async () => {
      try {
        const page = await getShifts({ status: "OPEN", size: 5 });
        return page.content;
      } catch {
        return MOCK_SHIFTS.filter((s) => s.status === "OPEN").slice(0, 5);
      }
    },
    enabled: independentOn,
  });

  const agencyOpen = useQuery({
    queryKey: ["caregiver-agency-open-shifts", "home"],
    queryFn: () => getCaregiverAgencyOpenShifts(),
    enabled: agencyOn,
  });

  const preview = useMemo(() => {
    const byId = new Map<string, Shift>();
    for (const s of independentOn ? (marketplace.data ?? []) : []) {
      byId.set(s.id, s);
    }
    for (const s of agencyOn ? (agencyOpen.data ?? []) : []) {
      byId.set(s.id, s);
    }
    return Array.from(byId.values())
      .sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        if (d !== 0) return d;
        return (a.startTime ?? "").localeCompare(b.startTime ?? "");
      })
      .slice(0, 5);
  }, [independentOn, agencyOn, marketplace.data, agencyOpen.data]);

  const loading =
    (independentOn && marketplace.isLoading) ||
    (agencyOn && agencyOpen.isLoading);

  return (
    <div className="space-y-10">
      <section className="animate-rise">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Caregiver workspace
        </p>
        <h1 className="mt-1 font-display text-4xl text-ink">
          {profile.data
            ? `Hi, ${profile.data.firstName}`
            : "Find your next shift"}
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          {showOpen
            ? "Open shifts include marketplace openings and shifts from agencies on your roster (labeled by agency)."
            : "Choose how you get work in your profile — independent marketplace shifts, agency rosters, or both."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {showOpen ? (
            <ButtonLink href="/caregiver/shifts" size="lg">
              <Search className="h-5 w-5" aria-hidden />
              Browse open shifts
            </ButtonLink>
          ) : null}
          {agencyOn ? (
            <ButtonLink
              href="/caregiver/rosters"
              size="lg"
              variant={showOpen ? "secondary" : "primary"}
            >
              <Building2 className="h-5 w-5" aria-hidden />
              My Agencies
            </ButtonLink>
          ) : null}
          <ButtonLink href="/caregiver/profile" variant="secondary" size="lg">
            <UserRound className="h-5 w-5" aria-hidden />
            Update profile
          </ButtonLink>
        </div>
      </section>

      {showOpen ? (
        <section className="animate-rise-delay">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-2xl text-ink">Open now</h2>
            <Link
              href="/caregiver/shifts"
              className="text-sm font-medium text-brand-deep hover:underline"
            >
              View all
            </Link>
          </div>
          {loading ? <LoadingBlock /> : null}
          {!loading && preview.length === 0 ? (
            <EmptyState
              title="No open shifts yet"
              body="Check back soon — families, facilities, and your agencies post throughout the week."
            />
          ) : (
            <div className="rounded-lg border border-line bg-paper px-4 sm:px-5">
              {preview.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  href={`/caregiver/shifts/${shift.id}`}
                  allowClaim
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
