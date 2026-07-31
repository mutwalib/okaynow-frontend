"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { ButtonLink } from "@/components/ui/button";
import { getMyClientProfile } from "@/lib/api";

export default function ClientSchedulePage() {
  const profile = useQuery({
    queryKey: ["client-profile"],
    queryFn: getMyClientProfile,
  });

  if (profile.isLoading) return <p className="text-ink-muted">Loading…</p>;
  if (!profile.data?.canViewShifts) {
    return (
      <p className="text-danger">You do not have permission to view shifts.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 font-display text-3xl text-ink">
            <CalendarDays className="h-7 w-7 text-brand" aria-hidden />
            Care schedule
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Days stay covered by default. Edit or delete future shifts here;
            past days are history only. Open the marketplace only when you need
            coverage for a specific date.
          </p>
        </div>
        <ButtonLink href="/client/shifts" variant="secondary">
          List view
        </ButtonLink>
      </div>
      <ScheduleCalendar
        shiftBasePath="/client/shifts"
        createPath={
          profile.data.canCreateShifts ? "/client/shifts/new" : undefined
        }
        canRequestReplacement={
          profile.data.canCreateShifts || profile.data.canUpdateShifts
        }
        canEdit={!!profile.data.canUpdateShifts}
        canDelete={!!profile.data.canDeleteShifts}
        enableRosterDrag={
          profile.data.canCreateShifts || profile.data.canUpdateShifts
        }
      />
    </div>
  );
}
