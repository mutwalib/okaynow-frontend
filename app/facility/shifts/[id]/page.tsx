"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Megaphone, Pencil, Store, Trash2 } from "lucide-react";
import {
  closeShiftMarketplace,
  deleteShift,
  getShift,
  markShiftNoShow,
  requestShiftReplacement,
} from "@/lib/api";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { canDeleteShift, canEditShift } from "@/lib/shift-mutability";
import { isPastShiftClockInWindow } from "@/lib/shift-window";
import { confirmAction, promptDeclineReason } from "@/lib/confirm";
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

export default function FacilityShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const query = useQuery({
    queryKey: ["shift", id],
    queryFn: () => getShift(id),
  });
  const remove = useMutation({
    mutationFn: () => deleteShift(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
      showToast("Shift removed from schedule", "success");
      router.push("/facility/schedule");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });
  const requestReplacement = useMutation({
    mutationFn: (slots: number) =>
      requestShiftReplacement(id, "Facility requested coverage", slots),
    onSuccess: () => {
      setCoverageOpen(false);
      qc.invalidateQueries({ queryKey: ["shift", id] });
      qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
      showToast("Opened for marketplace coverage", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });
  const closeMarketplace = useMutation({
    mutationFn: () => closeShiftMarketplace(id),
    onSuccess: () => {
      setCloseOpen(false);
      qc.invalidateQueries({ queryKey: ["shift", id] });
      qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
      showToast("Marketplace openings closed", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });
  const markNoShow = useMutation({
    mutationFn: (reason: string) => markShiftNoShow(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift", id] });
      qc.invalidateQueries({ queryKey: ["assigned-caregivers", id] });
      qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
      showToast("Marked as no-show", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  if (query.isLoading) return <p className="text-ink-muted">Loading…</p>;
  if (query.isError || !query.data) {
    return <p className="text-danger">Shift not found.</p>;
  }

  const s = query.data;
  const needed = s.requiredHeadcount ?? 1;
  const filled = s.filledSlots ?? 0;
  const missing = Math.max(0, needed - filled);
  const marketOpen = s.marketplaceSlots ?? 0;
  const allowEdit = canEditShift(s);
  const allowDelete = canDeleteShift(s);
  const canManageCoverage =
    !isPastShiftClockInWindow(s) &&
    !["COMPLETED", "CANCELLED", "NO_SHOW", "IN_PROGRESS"].includes(s.status);
  const maxMarketplaceSlots =
    missing > 0 ? Math.max(0, missing - marketOpen) : filled;

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-rise">
      <ButtonLink href="/facility/schedule" variant="ghost" className="px-0">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Schedule
      </ButtonLink>
      <StatusBadge status={s.status} />
      <h1 className="font-display text-4xl text-ink">
        {s.requiredQualification} · {formatDate(s.date)}
      </h1>
      <p className="text-ink-muted">
        {formatTime(s.startTime)} – {formatTime(s.endTime)}
      </p>
      <p className="text-sm text-ink">
        {filled}/{needed} caregivers
        {missing > 0 ? ` · ${missing} missing` : " · filled"}
      </p>
      <AddressLink address={s} className="text-ink-muted" />
      <p className="text-sm text-ink">Bill {formatMoney(s.billRate)}/hr</p>
      <AssignedCaregiversPanel shiftId={s.id} canReject={canManageCoverage} />
      {(s.status === "CONFIRMED" || s.status === "CLAIMED") ? (
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="text-sm font-medium text-ink">Caregiver no-show</p>
          <p className="mt-1 text-sm text-ink-muted">
            Only if the caregiver never arrived. Blocked after clock-in, arrival
            confirmation, or once the shift is in progress / completed.
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            disabled={markNoShow.isPending}
            onClick={() => {
              const reason = promptDeclineReason("Reason for marking no-show:");
              if (!reason) return;
              if (
                !confirmAction(
                  "Mark this caregiver as a no-show? Not allowed if they already clocked in or arrival was confirmed.",
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
      {canManageCoverage && maxMarketplaceSlots > 0 ? (
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="text-sm font-medium text-ink">
            {missing > 0
              ? `${missing} remaining slot(s) available to open`
              : "Open marketplace replacements if needed"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Opens this date only. Unopened remaining seats stay private.
          </p>
          <Button
            className="mt-3"
            size="sm"
            disabled={requestReplacement.isPending}
            onClick={() => setCoverageOpen(true)}
          >
            <Megaphone className="h-4 w-4" aria-hidden />
            Need coverage
          </Button>
        </div>
      ) : null}
      {canManageCoverage && marketOpen > 0 ? (
        <div className="rounded-lg border border-warn/40 bg-warn/5 p-4">
          <p className="text-sm font-medium text-ink">Marketplace open</p>
          <p className="mt-1 text-sm text-ink-muted">
            {marketOpen} slot{marketOpen === 1 ? "" : "s"} open for claims. Close
            before anyone picks them up.
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
      {s.notes ? <p className="whitespace-pre-wrap text-ink-muted">{s.notes}</p> : null}
      {s.status === "COMPLETED" ? <CaregiverReviewPanel shiftId={s.id} /> : null}
      {allowEdit || allowDelete ? (
        <div className="flex flex-wrap gap-3 border-t border-line pt-5">
          {allowEdit ? (
            <ButtonLink href={`/facility/shifts/${id}/edit`} variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit shift
            </ButtonLink>
          ) : null}
          {allowDelete ? (
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
      ) : null}

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
                timeLabel: `${formatTime(s.startTime)} – ${formatTime(s.endTime)}`,
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
