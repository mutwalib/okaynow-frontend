"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { ShiftBoard } from "@/components/shift-board";
import { ButtonLink } from "@/components/ui/button";
import { getMyClientProfile } from "@/lib/api";

export default function ClientShiftsPage() {
  const profile = useQuery({
    queryKey: ["client-profile"],
    queryFn: getMyClientProfile,
  });

  if (profile.isLoading) return <p className="text-ink-muted">Loading…</p>;
  if (!profile.data?.canViewShifts) {
    return <p className="text-danger">You do not have permission to view shifts.</p>;
  }

  return (
    <div>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">My shifts</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Track open, filled, and completed care visits. Bill rate is what you
            are charged.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/client/schedule" variant="secondary">
            Schedule calendar
          </ButtonLink>
          {profile.data.canCreateShifts ? (
            <ButtonLink href="/client/shifts/new">
              <PlusCircle className="h-4 w-4" aria-hidden />
              Post shift
            </ButtonLink>
          ) : null}
        </div>
      </div>
      <ShiftBoard basePath="/client/shifts" showBillRate defaultStatus="" />
    </div>
  );
}
