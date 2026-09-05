"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, PlusCircle } from "lucide-react";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { CaregiverVerificationDisclaimer } from "@/components/caregiver-verification-disclaimer";
import { ButtonLink } from "@/components/ui/button";
import { getHomeAgencyConnections } from "@/lib/api";

export default function FacilitySchedulePage() {
  const connections = useQuery({
    queryKey: ["home-agency-connections"],
    queryFn: getHomeAgencyConnections,
  });
  const coverageAgencies = useMemo(
    () =>
      (connections.data ?? [])
        .filter((c) => c.status === "ACTIVE")
        .map((c) => ({
          agencyId: c.agencyId,
          agencyDisplayName: c.agencyDisplayName,
        })),
    [connections.data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 font-display text-3xl text-ink">
            <CalendarDays className="h-7 w-7 text-brand" aria-hidden />
            Facility schedule
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Full-week view. Past days are grayed (history only). When you need
            coverage, send the opening to exactly one connected agency.
          </p>
          <div className="mt-3 max-w-xl">
            <CaregiverVerificationDisclaimer audience="facility" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/facility/shifts" variant="secondary">
            Board list
          </ButtonLink>
          <ButtonLink href="/facility/shifts/new?routine=1">
            <PlusCircle className="h-4 w-4" aria-hidden />
            Set daily routine
          </ButtonLink>
        </div>
      </div>
      <ScheduleCalendar
        shiftBasePath="/facility/shifts"
        createPath="/facility/shifts/new"
        canRequestReplacement
        canEdit
        canDelete
        coverageAgencies={coverageAgencies}
      />
    </div>
  );
}
