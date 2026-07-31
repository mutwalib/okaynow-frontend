"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { getMyCaregiverProfile, getShifts } from "@/lib/api";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingBlock, ShiftCard } from "@/components/shift-card";
import { MOCK_SHIFTS } from "@/lib/mockShifts";

export default function CaregiverHomePage() {
  const profile = useQuery({
    queryKey: ["caregiver-me"],
    queryFn: getMyCaregiverProfile,
    retry: false,
  });

  const openShifts = useQuery({
    queryKey: ["shifts-open-preview"],
    queryFn: async () => {
      try {
        const page = await getShifts({ status: "OPEN", size: 5 });
        return page.content;
      } catch {
        return MOCK_SHIFTS.filter((s) => s.status === "OPEN").slice(0, 5);
      }
    },
  });

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
          Open shifts across Massachusetts with pay rate and location up front.
          Claim what fits your credentials and schedule.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/caregiver/shifts" size="lg">
            <Search className="h-5 w-5" aria-hidden />
            Browse open shifts
          </ButtonLink>
          <ButtonLink href="/caregiver/profile" variant="secondary" size="lg">
            <UserRound className="h-5 w-5" aria-hidden />
            Update profile
          </ButtonLink>
        </div>
      </section>

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
        {openShifts.isLoading ? <LoadingBlock /> : null}
        {!openShifts.isLoading && (openShifts.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No open shifts yet"
            body="Check back soon — facilities and families post throughout the week."
          />
        ) : (
          <div className="rounded-lg border border-line bg-paper px-4 sm:px-5">
            {openShifts.data?.map((shift) => (
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
    </div>
  );
}
