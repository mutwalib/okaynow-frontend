"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Megaphone,
  Pencil,
  Save,
  Store,
  Trash2,
} from "lucide-react";
import {
  closeShiftMarketplace,
  confirmCaregiverArrival,
  deleteShift,
  getMyClientProfile,
  getShift,
  getVisitByShift,
  markShiftNoShow,
  recordClientAttendance,
  requestShiftReplacement,
} from "@/lib/api";
import { formatDate, formatMoney, formatTime, shiftHours } from "@/lib/format";
import { confirmAction, promptDeclineReason } from "@/lib/confirm";
import { canDeleteShift, canEditShift } from "@/lib/shift-mutability";
import { isPastShiftClockInWindow } from "@/lib/shift-window";
import { AddressLink } from "@/components/address-link";
import { AssignedCaregiversPanel } from "@/components/assigned-caregivers-panel";
import { CaregiverReviewPanel } from "@/components/caregiver-review-panel";
import {
  MarketplaceCoverageModal,
  type MarketplaceCoverageDraft,
} from "@/components/marketplace-coverage-modal";
import { StatusBadge } from "@/components/ui/badges";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { useToast } from "@/lib/toast-context";

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ClientShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [clockInLocal, setClockInLocal] = useState("");
  const [clockOutLocal, setClockOutLocal] = useState("");
  const [notes, setNotes] = useState("");
  const [showCorrection, setShowCorrection] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const query = useQuery({
    queryKey: ["shift", id],
    queryFn: () => getShift(id),
  });
  const profile = useQuery({
    queryKey: ["client-profile"],
    queryFn: getMyClientProfile,
  });
  const visit = useQuery({
    queryKey: ["visit", id],
    queryFn: () => getVisitByShift(id),
    enabled: !!id,
  });
  const remove = useMutation({
    mutationFn: () => deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      showToast("Shift deleted", "success");
      router.push("/client/schedule");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });
  const markNoShow = useMutation({
    mutationFn: (reason: string) => markShiftNoShow(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      queryClient.invalidateQueries({ queryKey: ["assigned-caregivers", id] });
      queryClient.invalidateQueries({ queryKey: ["schedule-calendar"] });
      showToast("Marked as no-show", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });
  const confirmArrival = useMutation({
    mutationFn: () => confirmCaregiverArrival(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit", id] });
      showToast("Thanks — you confirmed the caregiver arrived.", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });
  const saveAttendance = useMutation({
    mutationFn: () =>
      recordClientAttendance(id, {
        clockInAt: new Date(clockInLocal).toISOString(),
        clockOutAt: clockOutLocal
          ? new Date(clockOutLocal).toISOString()
          : undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visit", id] });
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      setShowCorrection(false);
      showToast("Attendance times saved for the caregiver.", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });
  const requestReplacement = useMutation({
    mutationFn: (slots: number) =>
      requestShiftReplacement(
        id,
        "Client requested replacement / coverage",
        slots,
      ),
    onSuccess: () => {
      setCoverageOpen(false);
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      queryClient.invalidateQueries({ queryKey: ["assigned-caregivers", id] });
      queryClient.invalidateQueries({ queryKey: ["schedule-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      showToast("Opened for marketplace coverage", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });
  const closeMarketplace = useMutation({
    mutationFn: () => closeShiftMarketplace(id),
    onSuccess: () => {
      setCloseOpen(false);
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      queryClient.invalidateQueries({ queryKey: ["schedule-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      showToast("Marketplace openings closed", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  if (query.isLoading) return <p className="text-ink-muted">Loading…</p>;
  if (query.isError || !query.data) {
    return <p className="text-danger">Shift not found.</p>;
  }

  const shift = query.data;
  const hours = shiftHours(shift);
  const v = visit.data;
  const canRecordAttendance = [
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
  ].includes(shift.status);
  const missedSelfClockIn =
    canRecordAttendance && (!v || isPastShiftClockInWindow(shift));
  const needed = shift.requiredHeadcount ?? 1;
  const filled = shift.filledSlots ?? 0;
  const missing = Math.max(0, needed - filled);
  const marketOpen = shift.marketplaceSlots ?? 0;
  const allowEdit = canEditShift(shift);
  const allowDelete = canDeleteShift(shift);
  const canManageCoverage =
    !isPastShiftClockInWindow(shift) &&
    !["COMPLETED", "CANCELLED", "NO_SHOW", "IN_PROGRESS"].includes(shift.status);
  const maxMarketplaceSlots =
    missing > 0 ? Math.max(0, missing - marketOpen) : filled;
  const canRequestCoverage =
    (profile.data?.canCreateShifts || profile.data?.canUpdateShifts) &&
    canManageCoverage &&
    maxMarketplaceSlots > 0;

  function openCorrection(prefill = true) {
    if (prefill) {
      setClockInLocal(
        toDatetimeLocalValue(v?.clockInAt) ||
          `${shift.date}T${shift.startTime.slice(0, 5)}`,
      );
      setClockOutLocal(
        toDatetimeLocalValue(v?.clockOutAt) ||
          `${shift.date}T${shift.endTime.slice(0, 5)}`,
      );
      setNotes(v?.notes ?? "");
    }
    setShowCorrection(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-rise">
      <ButtonLink href="/client/shifts" variant="ghost" className="px-0">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        My shifts
      </ButtonLink>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={shift.status} />
        <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold">
          {shift.requiredQualification}
        </span>
      </div>
      <h1 className="font-display text-4xl text-ink">{formatDate(shift.date)}</h1>
      <p className="text-ink-muted">
        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
      </p>

      <AssignedCaregiversPanel
        shiftId={shift.id}
        canReject={
          !!(profile.data?.canCreateShifts || profile.data?.canUpdateShifts) &&
          canManageCoverage
        }
      />

      {(shift.status === "CONFIRMED" || shift.status === "CLAIMED") &&
      (profile.data?.canUpdateShifts || profile.data?.canCreateShifts) ? (
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="text-sm font-medium text-ink">Caregiver no-show</p>
          <p className="mt-1 text-sm text-ink-muted">
            Only use this if the caregiver never arrived. Not available after
            clock-in, arrival confirmation, or once the shift is in progress /
            completed.
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            disabled={markNoShow.isPending}
            onClick={() => {
              const reason = promptDeclineReason(
                "Reason for marking no-show:",
              );
              if (!reason) return;
              if (
                !confirmAction(
                  "Mark this caregiver as a no-show? This cannot be used if they already clocked in or you confirmed arrival.",
                )
              ) {
                return;
              }
              markNoShow.mutate(reason);
            }}
          >
            Mark no-show
          </Button>
        </div>
      ) : null}

      {canRequestCoverage ? (
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="text-sm font-medium text-ink">
            {missing > 0
              ? `${missing} of ${needed} caregiver slot(s) still unfilled`
              : "Covered — open the marketplace only if you need a replacement"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {needed} required · {filled} assigned
            {missing > 0 ? ` · ${missing} remaining` : ""}.
            {marketOpen > 0 ? ` ${marketOpen} already open on marketplace.` : ""}
          </p>
          <Button
            className="mt-3"
            size="sm"
            disabled={requestReplacement.isPending}
            onClick={() => setCoverageOpen(true)}
          >
            <Megaphone className="h-4 w-4" aria-hidden />
            {missing > 0 ? "Need coverage" : "Call out → market"}
          </Button>
        </div>
      ) : shift.marketplacePosted && canManageCoverage && marketOpen > 0 ? (
        <div className="rounded-lg border border-warn/40 bg-warn/5 p-4">
          <p className="text-sm font-medium text-ink">Marketplace open</p>
          <p className="mt-1 text-sm text-ink-muted">
            {filled}/{needed} caregivers · {marketOpen} marketplace slot
            {marketOpen === 1 ? "" : "s"} open for claims. You can close this
            before anyone picks it up.
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            disabled={closeMarketplace.isPending}
            onClick={() => setCloseOpen(true)}
          >
            <Store className="h-4 w-4" aria-hidden />
            Close marketplace
          </Button>
        </div>
      ) : null}

      <div className="rounded-lg border border-line bg-paper p-4 space-y-3">
        <h2 className="font-display text-xl text-ink">Attendance</h2>
        {visit.isLoading ? (
          <p className="text-sm text-ink-muted">Checking…</p>
        ) : !v ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">
              The caregiver has not clocked in yet.
              {isPastShiftClockInWindow(shift)
                ? " The self clock-in window has ended — you can enter their times below if they ask."
                : ""}
            </p>
            {canRecordAttendance ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openCorrection()}
              >
                Enter clock-in / clock-out
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-medium">
                {[v.caregiverFirstName, v.caregiverLastName]
                  .filter(Boolean)
                  .join(" ") || "Caregiver"}
              </span>{" "}
              clocked in {new Date(v.clockInAt).toLocaleString()}
              {v.method === "GPS" ? " with GPS" : " (manual)"}.
            </p>
            {v.clockOutAt ? (
              <p className="text-sm text-ink-muted">
                Clocked out {new Date(v.clockOutAt).toLocaleString()}
              </p>
            ) : null}
            {v.clientArrivalConfirmed ? (
              <p className="text-sm font-medium text-emerald-700">
                You confirmed they reported
                {v.clientArrivalConfirmedAt
                  ? ` · ${new Date(v.clientArrivalConfirmedAt).toLocaleString()}`
                  : ""}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-ink-muted">
                  Please confirm the caregiver reported for this visit.
                </p>
                <Button
                  size="sm"
                  disabled={confirmArrival.isPending}
                  onClick={() => confirmArrival.mutate()}
                >
                  {!confirmArrival.isPending ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : null}
                  {confirmArrival.isPending
                    ? "Confirming…"
                    : "Confirm caregiver arrived"}
                </Button>
              </div>
            )}
            {missedSelfClockIn || v.method === "MANUAL" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openCorrection()}
              >
                Update clock-in / clock-out
              </Button>
            ) : null}
          </>
        )}

        {showCorrection ? (
          <form
            className="space-y-3 border-t border-line pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!clockInLocal) {
                showToast("Clock-in time is required.", "error");
                return;
              }
              saveAttendance.mutate();
            }}
          >
            <p className="text-xs text-ink-muted">
              Use this when the caregiver missed self clock-in and asks you to
              record their times.
            </p>
            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase text-ink-muted">
                Clock in
              </span>
              <input
                type="datetime-local"
                required
                className="mt-1 block w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-sm"
                value={clockInLocal}
                onChange={(e) => setClockInLocal(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase text-ink-muted">
                Clock out (optional)
              </span>
              <input
                type="datetime-local"
                className="mt-1 block w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-sm"
                value={clockOutLocal}
                onChange={(e) => setClockOutLocal(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase text-ink-muted">
                Note
              </span>
              <input
                type="text"
                className="mt-1 block w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-sm"
                placeholder="Optional note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={saveAttendance.isPending}>
                {!saveAttendance.isPending ? (
                  <Save className="h-4 w-4" aria-hidden />
                ) : null}
                {saveAttendance.isPending ? "Saving…" : "Save times"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowCorrection(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="rounded-lg border border-line bg-paper p-4 sm:max-w-sm">
        <p className="text-xs font-semibold uppercase text-ink-muted">Bill rate</p>
        <p className="font-display text-lg text-ink">
          {formatMoney(shift.billRate ?? 0)}
          <span className="text-xs font-sans text-ink-muted">/hr</span>
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          Est. invoice {formatMoney((shift.billRate ?? 0) * hours)}
        </p>
      </div>

      <div>
        <h2 className="font-display text-xl">Location</h2>
        <div className="mt-2">
          <AddressLink address={shift} className="text-ink-muted" />
        </div>
      </div>
      {shift.notes ? (
        <div>
          <h2 className="font-display text-xl">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-ink-muted">{shift.notes}</p>
        </div>
      ) : null}
      {shift.status === "COMPLETED" ? (
        <CaregiverReviewPanel shiftId={shift.id} />
      ) : null}
      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        {profile.data?.canUpdateShifts && allowEdit ? (
          <ButtonLink href={`/client/shifts/${id}/edit`} variant="secondary">
            <Pencil className="h-4 w-4" aria-hidden />
            Edit shift
          </ButtonLink>
        ) : null}
        {profile.data?.canDeleteShifts && allowDelete ? (
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() => {
              if (!confirmAction("Remove this shift from the schedule?")) return;
              remove.mutate();
            }}
          >
            {!remove.isPending ? <Trash2 className="h-4 w-4" aria-hidden /> : null}
            {remove.isPending ? "Deleting…" : "Delete shift"}
          </Button>
        ) : null}
      </div>

      <MarketplaceCoverageModal
        draft={
          coverageOpen && maxMarketplaceSlots > 0
            ? ({
                shiftId: id,
                maxSlots: maxMarketplaceSlots,
                defaultSlots: maxMarketplaceSlots,
                mode: missing > 0 ? "remaining" : "replace",
                required: needed,
                filled,
                remaining: missing,
                marketOpen,
                timeLabel: `${formatTime(shift.startTime)} – ${formatTime(shift.endTime)}`,
              } satisfies MarketplaceCoverageDraft)
            : null
        }
        busy={requestReplacement.isPending}
        onClose={() => setCoverageOpen(false)}
        onConfirm={(slots) => requestReplacement.mutate(slots)}
      />
      <ConfirmModal
        open={closeOpen}
        title="Close marketplace"
        body="Withdraw unclaimed marketplace openings for this date? This only works before a caregiver claims a slot."
        confirmLabel="Close marketplace"
        busy={closeMarketplace.isPending}
        onClose={() => setCloseOpen(false)}
        onConfirm={() => closeMarketplace.mutate()}
      />
    </div>
  );
}
