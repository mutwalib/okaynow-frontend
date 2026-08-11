"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarSearch, CircleStop, Timer, Undo2 } from "lucide-react";
import {
  clockInToShift,
  clockOutOfShift,
  getMyClaims,
  getVisitByShift,
  releaseShift,
} from "@/lib/api";
import { captureGps } from "@/lib/geo";
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

function VisitActions({
  shiftId,
  shiftStatus,
  claimStatus,
  shift,
}: {
  shiftId: string;
  shiftStatus: string;
  claimStatus: string;
  shift: { date: string; startTime: string; endTime: string };
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
  const claims = useQuery({
    queryKey: ["my-claims", page, pageSize],
    queryFn: () => getMyClaims(page, pageSize),
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

  const active =
    claims.data?.content.filter((claim) =>
      ["PENDING", "CONFIRMED"].includes(claim.status),
    ) ?? [];
  const history =
    claims.data?.content.filter((claim) =>
      ["CANCELLED", "COMPLETED"].includes(claim.status),
    ) ?? [];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-ink">My shifts</h1>
      <p className="text-sm text-ink-muted">
        Track pending claims, confirmed assignments, and clock in when you
        arrive on site.
      </p>

      {claims.isLoading ? <LoadingBlock /> : null}
      {claims.isError ? (
        <p className="text-danger">
          Could not load your shifts. Check that the backend is running.
        </p>
      ) : null}

      {!claims.isLoading && !claims.isError && active.length === 0 ? (
        <EmptyState
          title="No upcoming shifts"
          body="Browse the open board and claim a shift that matches your credentials."
          action={
            <ButtonLink href="/caregiver/shifts">
              <CalendarSearch className="h-4 w-4" aria-hidden />
              Browse open shifts
            </ButtonLink>
          }
        />
      ) : null}

      {active.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-xl text-ink">Upcoming</h2>
          <div className="space-y-3">
            {active.map((claim) => {
              const shift = claim.shift;
              return (
                <article
                  key={claim.id}
                  className="rounded-lg border border-line bg-paper p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <StatusBadge status={shift.status} />
                        <span className="text-xs font-semibold text-ink-muted">
                          {shift.requiredQualification}
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
        </section>
      ) : null}

      {history.length > 0 ? (
        <section>
          <h2 className="mb-3 font-display text-xl text-ink">History</h2>
          <div className="divide-y divide-line rounded-lg border border-line bg-paper px-4">
            {history.map((claim) => (
              <div
                key={claim.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{formatDate(claim.shift.date)}</p>
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
