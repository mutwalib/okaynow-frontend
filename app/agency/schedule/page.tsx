"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus } from "lucide-react";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { ButtonLink } from "@/components/ui/button";
import { getAgencyConnections, getAgencyScheduleCalendar } from "@/lib/api";
import {
  agencyScheduleSiteLabel,
  agencyScheduleSiteValue,
  parseAgencyScheduleSite,
} from "@/lib/types";

export default function AgencySchedulePage() {
  const connections = useQuery({
    queryKey: ["agency-connections"],
    queryFn: getAgencyConnections,
  });

  const siteOptions = useMemo(() => {
    return (connections.data ?? [])
      .map((c) => {
        const value = agencyScheduleSiteValue(c);
        if (!value) return null;
        return { value, label: agencyScheduleSiteLabel(c) };
      })
      .filter((x): x is { value: string; label: string } => x != null);
  }, [connections.data]);

  const [selectedSiteKey, setSelectedSiteKey] = useState("");

  useEffect(() => {
    if (selectedSiteKey || siteOptions.length !== 1) return;
    setSelectedSiteKey(siteOptions[0].value);
  }, [selectedSiteKey, siteOptions]);

  const createPath = useMemo(() => {
    const site = parseAgencyScheduleSite(selectedSiteKey);
    if (!site) return undefined;
    return site.kind === "client"
      ? `/agency/clients/${site.id}/shifts/new`
      : `/agency/facilities/${site.id}/shifts/new`;
  }, [selectedSiteKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 font-display text-3xl text-ink">
            <CalendarDays className="h-7 w-7 text-brand" aria-hidden />
            Home schedules
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            View and add schedules for connected homes and facilities. You see
            your roster caregivers by name; other coverage shows as
            &ldquo;Occupied by other.&rdquo; Care needs arrive in Shift
            requests — you cannot request marketplace cover on their behalf.
          </p>
        </div>
        {createPath ? (
          <ButtonLink href={`${createPath}?routine=1`} variant="secondary">
            <Plus className="h-4 w-4" aria-hidden />
            Create routine
          </ButtonLink>
        ) : null}
      </div>

      {connections.isLoading ? (
        <p className="text-sm text-ink-muted">Loading connections…</p>
      ) : null}
      {!connections.isLoading && siteOptions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-6 text-sm text-ink-muted">
          <p className="font-medium text-ink">No active connections yet</p>
          <p className="mt-1">
            Accept home or facility connection requests under{" "}
            <strong>Home connections</strong>, then return here to manage their
            schedules.
          </p>
        </div>
      ) : null}

      <ScheduleCalendar
        shiftBasePath="/agency/schedule/shifts"
        createPath={createPath}
        canRequestReplacement={false}
        canEdit
        canDelete
        respectAgencyManaged
        showRosterSlots
        clients={siteOptions}
        clientPickerLabel="Connected home or facility"
        selectedClientId={selectedSiteKey}
        onClientChange={setSelectedSiteKey}
        fetchCalendar={getAgencyScheduleCalendar}
        calendarHint="Select a connected home or facility. Add shifts here; incoming care requests stay in Shift requests."
        emptySiteMessage="Select a connected home or facility to view their schedule."
      />
    </div>
  );
}
