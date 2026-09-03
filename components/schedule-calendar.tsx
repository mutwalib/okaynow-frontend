"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Megaphone,
  Pencil,
  Plus,
  Store,
  Trash2,
  UserRound,
  UserRoundX,
} from "lucide-react";
import {
  closeShiftMarketplace,
  createShift,
  deleteShift,
  inviteCaregiverToShift,
  getMyCaregiverRoster,
  getMyClientProfile,
  getScheduleCalendar,
  requestShiftReplacement,
} from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { formatDate, formatShiftWindow, toIsoDate } from "@/lib/format";
import { mediaUrl } from "@/lib/api";
import { canDeleteShift, canEditShift } from "@/lib/shift-mutability";
import { isPastShiftClockInWindow } from "@/lib/shift-window";
import type {
  ClientRosterCaregiver,
  Qualification,
  ScheduleShiftCard,
} from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badges";
import { ConfirmModal } from "@/components/ui/modal";
import { Field, Select } from "@/components/ui/field";
import {
  MarketplaceCoverageModal,
  type MarketplaceCoverageDraft,
} from "@/components/marketplace-coverage-modal";

const ROSTER_DRAG_TYPE = "application/x-okaynow-roster-cg";

/** Half-open windows that abut at 3 PM / 11 PM so they never overlap. */
const STANDARD_WINDOWS = [
  { id: "day", label: "Day", startTime: "09:00", endTime: "15:00" },
  { id: "evening", label: "Evening", startTime: "15:00", endTime: "23:00" },
  { id: "overnight", label: "Overnight", startTime: "23:00", endTime: "09:00" },
] as const;

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(12, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function isPastDate(iso: string): boolean {
  return iso < todayIso();
}

const ACTIVE_STATUSES = new Set([
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "IN_PROGRESS",
]);

export function ScheduleCalendar({
  shiftBasePath,
  createPath,
  canRequestReplacement = true,
  enableRosterDrag = false,
  canEdit = false,
  canDelete = false,
  clients,
  selectedClientId = "",
  onClientChange,
  fetchCalendar,
  showRosterSlots = false,
  calendarHint,
  respectAgencyManaged = false,
}: {
  shiftBasePath: string;
  /** Path for creating a shift (query params appended). */
  createPath?: string;
  canRequestReplacement?: boolean;
  /** Family clients: drag roster caregivers onto weekdays. */
  enableRosterDrag?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Agency/admin: pick a connected home client. */
  clients?: { value: string; label: string }[];
  selectedClientId?: string;
  onClientChange?: (clientProfileId: string) => void;
  fetchCalendar?: (
    from: string,
    to: string,
    clientProfileId?: string,
  ) => Promise<import("@/lib/types").ScheduleDay[]>;
  /** Show caregiver names/photos on shift cards (agency view masks others). */
  showRosterSlots?: boolean;
  calendarHint?: string;
  /** Agency calendar: only agency-created shifts are editable. */
  respectAgencyManaged?: boolean;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [windowId, setWindowId] = useState<(typeof STANDARD_WINDOWS)[number]["id"]>("overnight");
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [dragOverShiftId, setDragOverShiftId] = useState<string | null>(null);
  const [coverageDraft, setCoverageDraft] =
    useState<MarketplaceCoverageDraft | null>(null);
  const [closeShiftId, setCloseShiftId] = useState<string | null>(null);

  const from = toIsoDate(weekStart);
  const to = toIsoDate(addDays(weekStart, 6));
  const standardWindow =
    STANDARD_WINDOWS.find((w) => w.id === windowId) ?? STANDARD_WINDOWS[2];

  const calendar = useQuery({
    queryKey: [
      fetchCalendar ? "agency-schedule-calendar" : "schedule-calendar",
      from,
      to,
      selectedClientId,
    ],
    queryFn: () =>
      fetchCalendar
        ? fetchCalendar(from, to, selectedClientId || undefined)
        : getScheduleCalendar(from, to),
    enabled: !fetchCalendar || !!selectedClientId,
  });

  const profile = useQuery({
    queryKey: ["client-profile"],
    queryFn: getMyClientProfile,
    enabled: enableRosterDrag,
  });

  const roster = useQuery({
    queryKey: ["my-caregiver-roster"],
    queryFn: getMyCaregiverRoster,
    enabled: enableRosterDrag,
  });

  const replace = useMutation({
    mutationFn: ({
      id,
      reason,
      slots,
    }: {
      id: string;
      reason?: string;
      slots?: number;
    }) => requestShiftReplacement(id, reason, slots),
    onSuccess: () => {
      setCoverageDraft(null);
      qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
      qc.invalidateQueries({ queryKey: ["shifts"] });
      showToast("Opened for marketplace coverage", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteShift(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
      qc.invalidateQueries({ queryKey: ["shifts"] });
      showToast("Shift removed from schedule", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const closeMarket = useMutation({
    mutationFn: (id: string) => closeShiftMarketplace(id),
    onSuccess: () => {
      setCloseShiftId(null);
      qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
      qc.invalidateQueries({ queryKey: ["shifts"] });
      showToast("Marketplace openings closed", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const assign = useMutation({
    mutationFn: async ({
      date,
      caregiver,
      existing,
      targetShiftId,
    }: {
      date: string;
      caregiver: ClientRosterCaregiver;
      existing: ScheduleShiftCard[];
      /** When set, assign onto this specific shift (must have an open slot). */
      targetShiftId?: string;
    }) => {
      const isAssignable = (s: ScheduleShiftCard) =>
        s.openSlots > 0 && !ACTIVE_STATUSES.has(s.status);

      if (targetShiftId) {
        const target = existing.find((s) => s.id === targetShiftId);
        if (!target || !isAssignable(target)) {
          throw new Error(
            "That shift is already filled — drop onto an open shift or an empty day",
          );
        }
        return inviteCaregiverToShift(
          target.id,
          caregiver.caregiverProfileId,
        );
      }

      const openShift = existing.find(isAssignable);
      if (openShift) {
        return inviteCaregiverToShift(
          openShift.id,
          caregiver.caregiverProfileId,
        );
      }

      const p = profile.data;
      if (!p?.addressLine || !p.city || !p.zip) {
        throw new Error(
          "Add your home address in Profile before scheduling caregivers",
        );
      }
      const qual =
        (caregiver.qualifications?.[0] as Qualification | undefined) ?? "CNA";
      const created = await createShift({
        requiredQualification: qual,
        date,
        scheduleType: "ONE_OFF",
        startTime: standardWindow.startTime,
        endTime: standardWindow.endTime,
        addressLine: p.addressLine,
        city: p.city,
        state: p.state || "MA",
        zip: p.zip,
        lat: p.lat ?? undefined,
        lng: p.lng ?? undefined,
        requiredHeadcount: 1,
        assignFromRoster: false,
      });
      const shift = created.shifts[0];
      await inviteCaregiverToShift(shift.id, caregiver.caregiverProfileId);
      return shift;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
      qc.invalidateQueries({ queryKey: ["shifts"] });
      showToast("Invitation sent — caregiver must accept", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const days = useMemo(() => {
    const map = new Map(
      (calendar.data ?? []).map((d) => [d.date, d.shifts] as const),
    );
    return Array.from({ length: 7 }, (_, i) => {
      const date = toIsoDate(addDays(weekStart, i));
      return { date, shifts: map.get(date) ?? [] };
    });
  }, [calendar.data, weekStart]);

  const weekLabel = `${formatDate(from)} – ${formatDate(to)}`;
  const newHref = (date: string) => {
    if (!createPath || isPastDate(date)) return null;
    const params = new URLSearchParams({
      date,
      startTime: standardWindow.startTime,
      endTime: standardWindow.endTime,
    });
    return `${createPath}?${params}`;
  };

  function parseDragCaregiver(e: React.DragEvent): ClientRosterCaregiver | null {
    try {
      const raw = e.dataTransfer.getData(ROSTER_DRAG_TYPE);
      if (!raw) return null;
      return JSON.parse(raw) as ClientRosterCaregiver;
    } catch {
      return null;
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">
            Week of {weekLabel}
          </p>
          <p className="text-sm text-ink-muted">
            {calendarHint ??
              (enableRosterDrag
                ? "Past days are history only. Coverage stays filled until you open a day to the marketplace."
                : "Past days are history only. Request coverage only when you need the marketplace.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {clients && clients.length > 0 ? (
            <Field label="Home client" className="min-w-[220px]">
              <Select
                value={selectedClientId}
                onChange={(e) => onClientChange?.(e.target.value)}
              >
                <option value="">Select a connected home…</option>
                {clients.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {enableRosterDrag ? (
            <select
              className="rounded-md border border-line bg-paper px-2 py-1.5 text-sm"
              value={windowId}
              onChange={(e) =>
                setWindowId(
                  e.target.value as (typeof STANDARD_WINDOWS)[number]["id"],
                )
              }
              title="Default hours when creating a shift on an empty day (windows abut — no overlap)"
            >
              {STANDARD_WINDOWS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}: {formatShiftWindow(w.startTime, w.endTime)}
                </option>
              ))}
            </select>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setWeekStart((w) => addDays(w, -7))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Prev
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
          >
            Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setWeekStart((w) => addDays(w, 7))}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      {fetchCalendar && !selectedClientId ? (
        <p className="text-sm text-ink-muted">
          Select a connected home to view their schedule.
        </p>
      ) : calendar.isLoading ? (
        <p className="text-sm text-ink-muted">Loading schedule…</p>
      ) : calendar.isError ? (
        <p className="text-sm text-danger">Could not load schedule.</p>
      ) : (
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 lg:gap-2">
          {days.map((day) => {
            const past = isPastDate(day.date);
            const isToday = day.date === todayIso();
            const createUrl = newHref(day.date);
            const interactive = !past && enableRosterDrag;
            const isDropTarget = interactive && dragOverDate === day.date;
            return (
              <section
                key={day.date}
                className={`flex min-h-[12rem] flex-col rounded-lg border p-2.5 transition ${
                  past
                    ? "border-line/60 bg-surface-2/50 opacity-75"
                    : isDropTarget
                      ? "border-brand bg-brand-soft/50 ring-2 ring-brand/30"
                      : isToday
                        ? "border-brand bg-brand-soft/40"
                        : "border-line bg-paper"
                }`}
                onDragOver={
                  interactive
                    ? (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                        setDragOverDate(day.date);
                      }
                    : undefined
                }
                onDragLeave={
                  interactive
                    ? () => {
                        setDragOverDate((d) => (d === day.date ? null : d));
                        setDragOverShiftId(null);
                      }
                    : undefined
                }
                onDrop={
                  interactive
                    ? (e) => {
                        e.preventDefault();
                        setDragOverDate(null);
                        setDragOverShiftId(null);
                        const caregiver = parseDragCaregiver(e);
                        if (!caregiver) return;
                        assign.mutate({
                          date: day.date,
                          caregiver,
                          existing: day.shifts,
                        });
                      }
                    : undefined
                }
              >
                <header className="mb-2 flex items-start justify-between gap-1 border-b border-line/70 pb-1.5">
                  <div>
                    <p
                      className={`text-xs font-medium uppercase tracking-wide ${
                        past ? "text-ink-muted/80" : "text-ink-muted"
                      }`}
                    >
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                        "en-US",
                        { weekday: "short" },
                      )}
                      {past ? " · past" : null}
                    </p>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        past ? "text-ink-muted" : "text-ink"
                      }`}
                    >
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )}
                    </p>
                  </div>
                  {createUrl ? (
                    <Link
                      href={createUrl}
                      className="rounded p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
                      title="Create shift this day"
                      aria-label={`Create shift on ${day.date}`}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}
                </header>

                <div className="flex-1">
                  {day.shifts.length === 0 ? (
                    past ? (
                      <p className="px-0.5 text-xs text-ink-muted">No shift</p>
                    ) : createUrl ? (
                      <Link
                        href={createUrl}
                        className="block rounded-md border border-dashed border-line px-2 py-4 text-center text-xs text-ink-muted hover:border-brand hover:text-brand-deep"
                      >
                        {enableRosterDrag
                          ? "Drop a caregiver or create a shift"
                          : "Create shift"}
                      </Link>
                    ) : (
                      <p className="px-0.5 text-xs text-ink-muted">No shift</p>
                    )
                  ) : (
                    <ul className="space-y-2">
                      {day.shifts.map((shift) => {
                        const canDropOnShift =
                          interactive &&
                          shift.openSlots > 0 &&
                          !ACTIVE_STATUSES.has(shift.status);
                        return (
                        <li key={shift.id}>
                          <PeriodStatusCard
                            shift={shift}
                            href={`${shiftBasePath}/${shift.id}`}
                            editHref={
                              canEdit &&
                              (!respectAgencyManaged || shift.agencyManaged) &&
                              !past &&
                              canEditShift({
                                date: day.date,
                                status: shift.status,
                              })
                                ? `${shiftBasePath}/${shift.id}/edit`
                                : undefined
                            }
                            past={
                              past ||
                              isPastShiftClockInWindow({
                                date: day.date,
                                startTime: shift.startTime,
                                endTime: shift.endTime,
                              })
                            }
                            dropTarget={
                              canDropOnShift && dragOverShiftId === shift.id
                            }
                            acceptDrop={canDropOnShift}
                            onDragOverShift={
                              canDropOnShift
                                ? (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.dataTransfer.dropEffect = "copy";
                                    setDragOverDate(day.date);
                                    setDragOverShiftId(shift.id);
                                  }
                                : undefined
                            }
                            onDragLeaveShift={
                              canDropOnShift
                                ? () =>
                                    setDragOverShiftId((id) =>
                                      id === shift.id ? null : id,
                                    )
                                : undefined
                            }
                            onDropCaregiver={
                              canDropOnShift
                                ? (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverDate(null);
                                    setDragOverShiftId(null);
                                    const caregiver = parseDragCaregiver(e);
                                    if (!caregiver) return;
                                    assign.mutate({
                                      date: day.date,
                                      caregiver,
                                      existing: day.shifts,
                                      targetShiftId: shift.id,
                                    });
                                  }
                                : undefined
                            }
                            canRequestReplacement={
                              canRequestReplacement &&
                              !past &&
                              !isPastShiftClockInWindow({
                                date: day.date,
                                startTime: shift.startTime,
                                endTime: shift.endTime,
                              })
                            }
                            canDelete={
                              canDelete &&
                              (!respectAgencyManaged || shift.agencyManaged) &&
                              !past &&
                              canDeleteShift({
                                date: day.date,
                                status: shift.status,
                              })
                            }
                            busy={
                              replace.isPending ||
                              remove.isPending ||
                              closeMarket.isPending ||
                              assign.isPending
                            }
                            onRequestReplacement={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const required = Math.max(
                                1,
                                shift.requiredHeadcount,
                              );
                              const filled = shift.filledSlots;
                              const remaining = Math.max(0, required - filled);
                              const marketOpen = shift.marketplaceSlots ?? 0;
                              const maxSlots =
                                remaining > 0
                                  ? Math.max(0, remaining - marketOpen)
                                  : filled;
                              if (maxSlots < 1) return;
                              setCoverageDraft({
                                shiftId: shift.id,
                                maxSlots,
                                defaultSlots:
                                  remaining > 0 ? maxSlots : 1,
                                mode: remaining > 0 ? "remaining" : "replace",
                                required,
                                filled,
                                remaining,
                                marketOpen,
                                timeLabel: formatShiftWindow(
                                  shift.startTime,
                                  shift.endTime,
                                ),
                              });
                            }}
                            onDelete={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (
                                !confirmAction(
                                  "Remove this shift from the schedule?",
                                )
                              ) {
                                return;
                              }
                              remove.mutate(shift.id);
                            }}
                            onCloseMarketplace={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCloseShiftId(shift.id);
                            }}
                            showRosterSlots={showRosterSlots}
                          />
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {enableRosterDrag ? (
        <div className="rounded-lg border border-line bg-paper p-3">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-ink">Your caregivers</p>
              <p className="text-xs text-ink-muted">
                Drop onto an open shift card to fill it, or onto an empty day to
                create{" "}
                {formatShiftWindow(
                  standardWindow.startTime,
                  standardWindow.endTime,
                )}
                .
              </p>
            </div>
            {createPath ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => router.push(`${createPath}?routine=1`)}
              >
                Daily routine…
              </Button>
            ) : null}
          </div>
          {roster.isLoading ? (
            <p className="text-sm text-ink-muted">Loading roster…</p>
          ) : (roster.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">
              No caregivers on your roster yet. Ask the agency to add your
              primary or rotational caregivers, then drag them onto days here.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {(roster.data ?? []).map((cg) => (
                <li key={cg.assignmentId}>
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        ROSTER_DRAG_TYPE,
                        JSON.stringify(cg),
                      );
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="inline-flex cursor-grab items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm active:cursor-grabbing"
                    title={`${cg.assignmentType} · drag onto an open shift or empty day`}
                  >
                    <GripVertical
                      className="h-3.5 w-3.5 text-ink-muted"
                      aria-hidden
                    />
                    <span className="font-medium text-ink">
                      {cg.firstName} {cg.lastName}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-ink-muted">
                      {cg.assignmentType === "PRIMARY" ? "Primary" : "Rotating"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {assign.isPending ? (
            <p className="mt-2 text-xs text-ink-muted">Scheduling…</p>
          ) : null}
        </div>
      ) : null}

      <MarketplaceCoverageModal
        draft={coverageDraft}
        busy={replace.isPending}
        onClose={() => setCoverageDraft(null)}
        onConfirm={(slots) => {
          if (!coverageDraft) return;
          replace.mutate({
            id: coverageDraft.shiftId,
            slots,
            reason:
              coverageDraft.mode === "remaining"
                ? "Coverage requested"
                : "Caregiver call-out — replacement requested",
          });
        }}
      />
      <ConfirmModal
        open={!!closeShiftId}
        title="Close marketplace"
        body="Withdraw unclaimed marketplace openings for this date? This only works before a caregiver claims a slot. Assigned caregivers stay on the shift."
        confirmLabel="Close marketplace"
        busy={closeMarket.isPending}
        onClose={() => setCloseShiftId(null)}
        onConfirm={() => {
          if (closeShiftId) closeMarket.mutate(closeShiftId);
        }}
      />
    </div>
  );
}

function PeriodStatusCard({
  shift,
  href,
  editHref,
  past,
  acceptDrop = false,
  dropTarget = false,
  onDragOverShift,
  onDragLeaveShift,
  onDropCaregiver,
  canRequestReplacement,
  canDelete,
  busy,
  onRequestReplacement,
  onDelete,
  onCloseMarketplace,
  showRosterSlots = false,
}: {
  shift: ScheduleShiftCard;
  href: string;
  editHref?: string;
  past: boolean;
  acceptDrop?: boolean;
  dropTarget?: boolean;
  onDragOverShift?: (e: React.DragEvent) => void;
  onDragLeaveShift?: () => void;
  onDropCaregiver?: (e: React.DragEvent) => void;
  canRequestReplacement: boolean;
  canDelete: boolean;
  busy: boolean;
  onRequestReplacement: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onCloseMarketplace: (e: React.MouseEvent) => void;
  showRosterSlots?: boolean;
}) {
  const required = Math.max(1, shift.requiredHeadcount);
  const filled = shift.filledSlots;
  const missing = Math.max(0, required - filled);
  const covered = missing === 0 && !shift.marketplacePosted;
  const routine = shift.scheduleType === "DAILY_ROUTINE";
  const remaining = Math.max(0, required - filled);
  const marketOpen = shift.marketplaceSlots ?? 0;
  const maxOpen = remaining > 0 ? Math.max(0, remaining - marketOpen) : filled;
  const actionable =
    canRequestReplacement &&
    !ACTIVE_STATUSES.has(shift.status) &&
    maxOpen > 0;
  const canClose =
    canRequestReplacement &&
    !ACTIVE_STATUSES.has(shift.status) &&
    !!shift.marketplacePosted &&
    marketOpen > 0;

  return (
    <div
      className={`rounded-md border text-xs shadow-sm ${
        dropTarget
          ? "border-brand bg-brand-soft/60 ring-2 ring-brand/40"
          : past
            ? "border-line/50 bg-surface-2/40"
            : routine
              ? "border-line bg-paper"
              : "border-line/80 bg-paper"
      }`}
      onDragOver={onDragOverShift}
      onDragLeave={onDragLeaveShift}
      onDrop={onDropCaregiver}
      title={
        acceptDrop
          ? "Drop a caregiver here to fill this shift"
          : undefined
      }
    >
      <Link
        href={href}
        className={`block space-y-1.5 p-2 transition ${
          past ? "cursor-default" : "hover:bg-surface-2/60"
        }`}
      >
        <div className="flex items-start justify-between gap-1">
          <p className={`font-semibold tabular-nums ${past ? "text-ink-muted" : "text-ink"}`}>
            {formatShiftWindow(shift.startTime, shift.endTime)}
          </p>
          {routine ? (
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
              Daily
            </span>
          ) : null}
        </div>
        <StatusBadge status={shift.status} />
        <p
          className={`tabular-nums ${
            missing > 0 && shift.marketplacePosted
              ? "font-medium text-warn"
              : past
                ? "text-ink-muted"
                : "text-ink"
          }`}
        >
          {filled}/{required} CG
          {missing > 0 ? (
            <span className={shift.marketplacePosted ? "text-warn" : "text-ink-muted"}>
              {" "}
              · {missing} missing
            </span>
          ) : (
            <span className="text-ink-muted"> · filled</span>
          )}
        </p>
        {showRosterSlots ? (
          <ul className="space-y-1 pt-0.5">
            {shift.roster.map((slot) => (
              <li key={slot.claimId} className="flex items-center gap-1.5">
                {slot.masked ? (
                  <>
                    <UserRoundX className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />
                    <span className="truncate text-ink-muted">
                      {slot.displayLabel ?? "Occupied by other"}
                    </span>
                  </>
                ) : (
                  <>
                    {slot.profilePhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(slot.profilePhotoUrl) ?? slot.profilePhotoUrl}
                        alt=""
                        className="h-5 w-5 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />
                    )}
                    <span className="truncate">
                      {slot.firstName} {slot.lastName}
                    </span>
                  </>
                )}
              </li>
            ))}
            {Array.from({ length: missing }).map((_, i) => (
              <li
                key={`open-${i}`}
                className={`flex items-center gap-1.5 ${
                  shift.marketplacePosted ? "text-warn" : "text-ink-muted"
                }`}
              >
                <UserRoundX className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {shift.marketplacePosted ? "Open slot" : "Unfilled"}
              </li>
            ))}
          </ul>
        ) : null}
        {shift.marketplacePosted && !past ? (
          <p className="text-[11px] text-warn">Marketplace open</p>
        ) : covered && !past ? (
          <p className="text-[11px] text-ink-muted">Covered</p>
        ) : null}
      </Link>
      {!past ? (
        <div className="flex flex-wrap gap-1 border-t border-line/70 p-1.5">
          {editHref ? (
            <Link
              href={editHref}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-line px-1.5 py-1 text-[11px] text-ink hover:bg-surface-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="h-3 w-3" aria-hidden />
              Edit
            </Link>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-line px-1.5 py-1 text-[11px] text-danger hover:bg-danger/5 disabled:opacity-50"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              Delete
            </button>
          ) : null}
          {actionable ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={onRequestReplacement}
            >
              <Megaphone className="h-3 w-3" aria-hidden />
              {filled === 0 ? "Need coverage" : "Call out → market"}
            </Button>
          ) : null}
          {canClose ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={onCloseMarketplace}
            >
              <Store className="h-3 w-3" aria-hidden />
              Close marketplace
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
