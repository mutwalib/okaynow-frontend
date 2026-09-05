"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarSearch, CircleStop, Timer, Undo2 } from "lucide-react";
import {
  clockInToShift,
  clockOutOfShift,
  getMyClaims,
  getVisitByShift,
  releaseShift,
} from "@/lib/api";
import {
  captureGps,
  EVV_GEOFENCE_FEET,
  isWithinGeofence,
} from "@/lib/geo";
import { AddressLink } from "@/components/address-link";
import { EmptyState, LoadingBlock } from "@/components/shift-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { ListPagination } from "@/components/ui/list-pagination";
import { StatusBadge } from "@/components/ui/badges";
import { formatDate, formatMoney, formatTime, shiftHours } from "@/lib/format";
import { confirmAction } from "@/lib/confirm";
import { useListPagination } from "@/lib/pagination";
import {
  EARLY_CLOCK_IN_MINUTES,
  earliestClockInDateTime,
  isBeforeShiftClockInWindow,
  isPastShiftClockInWindow,
} from "@/lib/shift-window";
import { useToast } from "@/lib/toast-context";
import type { ShiftClaim } from "@/lib/types";

const FILTER_ALL = "all";
const FILTER_INDEPENDENT = "independent";

type AgencyFilter = typeof FILTER_ALL | typeof FILTER_INDEPENDENT | string;

function agencyKey(claim: ShiftClaim): string {
  return claim.shift.agencyId ?? FILTER_INDEPENDENT;
}

function agencyLabel(claim: ShiftClaim): string {
  if (claim.shift.agencyId) {
    return claim.shift.agencyDisplayName?.trim() || "Agency";
  }
  return "Independent";
}

function matchesAgencyFilter(claim: ShiftClaim, filter: AgencyFilter): boolean {
  if (filter === FILTER_ALL) return true;
  if (filter === FILTER_INDEPENDENT) return !claim.shift.agencyId;
  return claim.shift.agencyId === filter;
}

function groupByAgency(claims: ShiftClaim[]) {
  const map = new Map<string, { label: string; items: ShiftClaim[] }>();
  for (const claim of claims) {
    const key = agencyKey(claim);
    const existing = map.get(key);
    if (existing) existing.items.push(claim);
    else map.set(key, { label: agencyLabel(claim), items: [claim] });
  }
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, label: value.label, items: value.items }))
    .sort((a, b) => {
      if (a.key === FILTER_INDEPENDENT) return -1;
      if (b.key === FILTER_INDEPENDENT) return 1;
      return a.label.localeCompare(b.label);
    });
}

function VisitActions({
  shiftId,
  shiftStatus,
  claimStatus,
  shift,
}: {
  shiftId: string;
  shiftStatus: string;
  claimStatus: string;
  shift: {
    date: string;
    startTime: string;
    endTime: string;
    lat?: number | null;
    lng?: number | null;
  };
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const visit = useQuery({
    queryKey: ["visit", shiftId],
    queryFn: () => getVisitByShift(shiftId),
    enabled: claimStatus === "CONFIRMED",
  });
  const pastWindow = isPastShiftClockInWindow(shift);
  const beforeWindow = isBeforeShiftClockInWindow(shift);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["visit", shiftId] });
    queryClient.invalidateQueries({ queryKey: ["my-claims"] });
    queryClient.invalidateQueries({ queryKey: ["shift", shiftId] });
  }

  const clockIn = useMutation({
    mutationFn: async () => {
      const gps = await captureGps();
      if (gps.lat == null || gps.lng == null) {
        throw new Error("Location permission is required to clock in");
      }
      if (
        shift.lat != null &&
        shift.lng != null &&
        !isWithinGeofence(
          { lat: gps.lat, lng: gps.lng },
          { lat: shift.lat, lng: shift.lng },
        )
      ) {
        throw new Error(
          `You must be within ${EVV_GEOFENCE_FEET} ft of the visit address to clock in`,
        );
      }
      return clockInToShift(shiftId, gps);
    },
    onSuccess: () => {
      invalidate();
      showToast("Clocked in. Waiting for the client to confirm you arrived.", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      const gps = await captureGps();
      if (gps.lat == null || gps.lng == null) {
        throw new Error("Location permission is required to clock out");
      }
      if (
        shift.lat != null &&
        shift.lng != null &&
        !isWithinGeofence(
          { lat: gps.lat, lng: gps.lng },
          { lat: shift.lat, lng: shift.lng },
        )
      ) {
        throw new Error(
          `You must be within ${EVV_GEOFENCE_FEET} ft of the visit address to clock out`,
        );
      }
      return clockOutOfShift(shiftId, gps);
    },
    onSuccess: () => {
      invalidate();
      showToast("Clocked out.", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  if (claimStatus !== "CONFIRMED") {
    return (
      <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">
        Waiting for agency confirmation before you can clock in.
      </p>
    );
  }

  if (visit.isLoading) {
    return (
      <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">
        Checking attendance…
      </p>
    );
  }

  const v = visit.data;
  if (!v && (shiftStatus === "CONFIRMED" || shiftStatus === "IN_PROGRESS")) {
    if (pastWindow) {
      return (
        <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <p className="text-amber-700 font-medium">
            Clock-in window closed for this shift.
          </p>
          <p className="text-ink-muted">
            Ask the client to update your clock-in and clock-out times. If you
            have another shift that starts right after this one, clock in on
            that next shift instead.
          </p>
        </div>
      );
    }
    if (beforeWindow) {
      const opensAt = earliestClockInDateTime(shift);
      return (
        <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          <p className="text-success">Confirmed by the agency</p>
          <p className="text-ink-muted">
            Clock in opens {EARLY_CLOCK_IN_MINUTES} minutes before the shift
            starts ({opensAt.toLocaleString()}).
          </p>
        </div>
      );
    }
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <p className="text-sm text-success">Confirmed by the agency</p>
        <Button
          size="sm"
          disabled={clockIn.isPending}
          onClick={() => clockIn.mutate()}
        >
          <Timer className="h-4 w-4" aria-hidden />
          {clockIn.isPending ? "Clocking in…" : "Clock in"}
        </Button>
      </div>
    );
  }

  if (v) {
    return (
      <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <p className="text-success">
          Clocked in {new Date(v.clockInAt).toLocaleString()}
          {v.method === "GPS" ? " (GPS)" : ""}
        </p>
        <p
          className={
            v.clientArrivalConfirmed ? "text-success" : "text-amber-700"
          }
        >
          {v.clientArrivalConfirmed
            ? `Client confirmed arrival${
                v.clientArrivalConfirmedAt
                  ? ` · ${new Date(v.clientArrivalConfirmedAt).toLocaleString()}`
                  : ""
              }`
            : "Waiting for client to confirm you reported"}
        </p>
        {!v.clockOutAt && shiftStatus === "IN_PROGRESS" ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={clockOut.isPending}
            onClick={() => clockOut.mutate()}
          >
            <CircleStop className="h-4 w-4" aria-hidden />
            {clockOut.isPending ? "Clocking out…" : "Clock out"}
          </Button>
        ) : null}
        {v.clockOutAt ? (
          <p className="text-ink-muted">
            Clocked out {new Date(v.clockOutAt).toLocaleString()}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <p className="mt-4 border-t border-line pt-4 text-sm text-success">
      Confirmed by the agency
    </p>
  );
}

export default function CaregiverMyShiftsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { page, setPage, pageSize, setPageSize } = useListPagination();
  const [agencyFilter, setAgencyFilter] = useState<AgencyFilter>(FILTER_ALL);
  const claims = useQuery({
    queryKey: ["my-claims", page, pageSize],
    queryFn: () => getMyClaims(page, Math.max(pageSize, 50)),
  });

  const release = useMutation({
    mutationFn: (shiftId: string) => releaseShift(shiftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      showToast("Shift released back to the open board.", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const items = claims.data?.content ?? [];
  const agencyOptions = useMemo(() => {
    const map = new Map<string, string>();
    let hasIndependent = false;
    for (const claim of items) {
      if (!claim.shift.agencyId) {
        hasIndependent = true;
        continue;
      }
      map.set(
        claim.shift.agencyId,
        claim.shift.agencyDisplayName?.trim() || "Agency",
      );
    }
    return {
      hasIndependent,
      agencies: Array.from(map.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [items]);

  const filtered = useMemo(
    () => items.filter((c) => matchesAgencyFilter(c, agencyFilter)),
    [items, agencyFilter],
  );
  const active = filtered.filter((claim) =>
    ["PENDING", "CONFIRMED"].includes(claim.status),
  );
  const history = filtered.filter((claim) =>
    ["CANCELLED", "COMPLETED"].includes(claim.status),
  );
  const activeGroups = groupByAgency(active);
  const historyGroups = groupByAgency(history);
  const showGroupHeaders = agencyFilter === FILTER_ALL;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">My shifts</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Track pending claims, confirmed assignments, and clock in when you
          arrive on site.
        </p>
      </div>

      {agencyOptions.agencies.length > 0 || agencyOptions.hasIndependent ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="All"
            active={agencyFilter === FILTER_ALL}
            onClick={() => setAgencyFilter(FILTER_ALL)}
          />
          {agencyOptions.hasIndependent ? (
            <FilterChip
              label="Independent"
              active={agencyFilter === FILTER_INDEPENDENT}
              onClick={() => setAgencyFilter(FILTER_INDEPENDENT)}
            />
          ) : null}
          {agencyOptions.agencies.map((a) => (
            <FilterChip
              key={a.id}
              label={a.name}
              active={agencyFilter === a.id}
              onClick={() => setAgencyFilter(a.id)}
            />
          ))}
        </div>
      ) : null}

      {claims.isLoading ? <LoadingBlock /> : null}
      {claims.isError ? (
        <p className="text-danger">
          Could not load your shifts. Check that the backend is running.
        </p>
      ) : null}

      {!claims.isLoading && !claims.isError && active.length === 0 ? (
        <EmptyState
          title="No upcoming shifts"
          body={
            agencyFilter !== FILTER_ALL
              ? "No upcoming shifts for this agency filter."
              : "Browse the open board and claim a shift that matches your credentials."
          }
          action={
            agencyFilter === FILTER_ALL ? (
              <ButtonLink href="/caregiver/shifts">
                <CalendarSearch className="h-4 w-4" aria-hidden />
                Browse open shifts
              </ButtonLink>
            ) : undefined
          }
        />
      ) : null}

      {active.length > 0 ? (
        <section className="space-y-5">
          <h2 className="font-display text-xl text-ink">Upcoming</h2>
          {activeGroups.map((group) => (
            <div key={`up-${group.key}`} className="space-y-3">
              {showGroupHeaders && activeGroups.length > 1 ? (
                <h3 className="text-sm font-semibold text-brand">{group.label}</h3>
              ) : null}
              {group.items.map((claim) => {
                const shift = claim.shift;
                return (
                  <article
                    key={claim.id}
                    className="rounded-lg border border-line bg-paper p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <StatusBadge status={shift.status} />
                          <span className="text-xs font-semibold text-ink-muted">
                            {shift.requiredQualification}
                          </span>
                          <span className="text-xs font-semibold text-brand">
                            {agencyLabel(claim)}
                          </span>
                        </div>
                        <ButtonLink
                          href={`/caregiver/shifts/${shift.id}`}
                          variant="ghost"
                          className="px-0 font-display text-xl text-ink"
                        >
                          {formatDate(shift.date)} · {formatTime(shift.startTime)}–
                          {formatTime(shift.endTime)}
                        </ButtonLink>
                        <p className="text-sm">
                          <AddressLink
                            address={shift}
                            multiline={false}
                            showDirectionsHint={false}
                            className="text-ink-muted"
                          />
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg text-brand-deep">
                          {formatMoney(Number(shift.payRate ?? 0))}/hr
                        </p>
                        <p className="text-xs text-ink-muted">
                          {formatMoney(
                            Number(shift.payRate ?? 0) * shiftHours(shift),
                          )}{" "}
                          estimated
                        </p>
                      </div>
                    </div>
                    {claim.status === "PENDING" ? (
                      <div className="mt-4 border-t border-line pt-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={release.isPending}
                          onClick={() => {
                            if (
                              confirmAction(
                                "Release this shift claim? It will go back on the open board for others.",
                              )
                            ) {
                              release.mutate(shift.id);
                            }
                          }}
                        >
                          <Undo2 className="h-4 w-4" aria-hidden />
                          {release.isPending ? "Releasing…" : "Release shift"}
                        </Button>
                      </div>
                    ) : (
                      <VisitActions
                        shiftId={shift.id}
                        shiftStatus={shift.status}
                        claimStatus={claim.status}
                        shift={shift}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          ))}
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-ink">History</h2>
          {historyGroups.map((group) => (
            <div key={`hist-${group.key}`}>
              {showGroupHeaders && historyGroups.length > 1 ? (
                <h3 className="mb-2 text-sm font-semibold text-brand">
                  {group.label}
                </h3>
              ) : null}
              <div className="divide-y divide-line rounded-lg border border-line bg-paper px-4">
                {group.items.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div>
                      <p className="font-medium">
                        {formatDate(claim.shift.date)}
                      </p>
                      <p className="text-sm font-medium text-brand">
                        {agencyLabel(claim)}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {claim.shift.city} · {claim.shift.requiredQualification}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {formatTime(claim.shift.startTime)} –{" "}
                        {formatTime(claim.shift.endTime)} ·{" "}
                        {shiftHours(claim.shift).toFixed(1)} hours
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-ink-muted">
                      {claim.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}
      {claims.data ? (
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalElements={claims.data.totalElements}
          totalPages={claims.data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={claims.isFetching}
        />
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md border border-brand bg-brand/10 px-3 py-1.5 text-sm font-semibold text-brand-deep"
          : "rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink-muted"
      }
    >
      {label}
    </button>
  );
}
