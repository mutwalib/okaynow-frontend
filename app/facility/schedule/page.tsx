"use client";

import { CalendarDays, PlusCircle } from "lucide-react";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { ButtonLink } from "@/components/ui/button";

export default function FacilitySchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 font-display text-3xl text-ink">
            <CalendarDays className="h-7 w-7 text-brand" aria-hidden />
            Facility schedule
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Full-week view. Past days are grayed (history only). Coverage is
            filled until you open a day to the marketplace.
          </p>
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
      />
    </div>
  );
}
