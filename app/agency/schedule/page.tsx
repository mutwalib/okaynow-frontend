"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus } from "lucide-react";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { ButtonLink } from "@/components/ui/button";
import { getAgencyConnections, getAgencyScheduleCalendar } from "@/lib/api";

export default function AgencySchedulePage() {
  const connections = useQuery({
    queryKey: ["agency-connections"],
    queryFn: getAgencyConnections,
  });

  const clientOptions = useMemo(() => {
    return (connections.data ?? [])
      .filter((c) => c.status === "ACTIVE" && c.clientProfileId)
      .map((c) => ({
        value: c.clientProfileId as string,
        label: `${c.homeLastName ?? ""}, ${c.homeFirstName ?? "Home"}`.trim(),
      }));
  }, [connections.data]);

  const [selectedClientId, setSelectedClientId] = useState("");

  const createPath = selectedClientId
    ? `/agency/clients/${selectedClientId}/shifts/new`
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 font-display text-3xl text-ink">
            <CalendarDays className="h-7 w-7 text-brand" aria-hidden />
            Home schedules
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            View and add schedules for connected homes. You see your roster
            caregivers by name; other coverage shows as &ldquo;Occupied by
            other.&rdquo; Care needs from homes arrive in Shift requests — you
            cannot request marketplace cover on their behalf.
          </p>
        </div>
        {createPath ? (
          <ButtonLink href={`${createPath}?routine=1`} variant="secondary">
            <Plus className="h-4 w-4" aria-hidden />
            Create routine
          </ButtonLink>
        ) : null}
      </div>

      <ScheduleCalendar
        shiftBasePath="/agency/schedule/shifts"
        createPath={createPath}
        canRequestReplacement={false}
        canEdit
        canDelete
        respectAgencyManaged
        showRosterSlots
        clients={clientOptions}
        selectedClientId={selectedClientId}
        onClientChange={setSelectedClientId}
        fetchCalendar={getAgencyScheduleCalendar}
        calendarHint="Select a connected home. Add shifts for them here; incoming care requests stay in Shift requests."
      />
    </div>
  );
}
