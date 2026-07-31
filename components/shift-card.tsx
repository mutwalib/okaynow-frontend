"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Hand, MapPinned } from "lucide-react";
import type { Shift } from "@/lib/types";
import { claimShift } from "@/lib/api";
import { formatDate, formatMoney, formatTime, shiftHours } from "@/lib/format";
import { mapsDirectionsUrl } from "@/lib/maps";
import { useToast } from "@/lib/toast-context";
import { Button } from "./ui/button";
import { PayRateBadge, StatusBadge } from "./ui/badges";

export function ShiftCard({
  shift,
  href,
  showBillRate = false,
  allowClaim = false,
}: {
  shift: Shift;
  href: string;
  showBillRate?: boolean;
  /** Caregiver board: show Claim on OPEN shifts. */
  allowClaim?: boolean;
}) {
  const hours = shiftHours(shift);
  const mapsHref = mapsDirectionsUrl(shift);
  const router = useRouter();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const claim = useMutation({
    mutationFn: () => claimShift(shift.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["shifts"] });
      await qc.cancelQueries({ queryKey: ["shifts-open-preview"] });
      const strip = (data: unknown) => {
        if (!data || typeof data !== "object") return data;
        if (Array.isArray(data)) {
          return (data as Shift[]).filter((s) => s.id !== shift.id);
        }
        const page = data as { content?: Shift[]; totalElements?: number };
        if (Array.isArray(page.content)) {
          return {
            ...page,
            content: page.content.filter((s) => s.id !== shift.id),
            totalElements: Math.max(
              0,
              (page.totalElements ?? page.content.length) - 1,
            ),
          };
        }
        return data;
      };
      qc.setQueriesData({ queryKey: ["shifts"] }, strip);
      qc.setQueriesData({ queryKey: ["shifts-open-preview"] }, strip);
    },
    onSuccess: () => {
      showToast("Shift claimed", "success");
      qc.invalidateQueries({ queryKey: ["shifts"] });
      qc.invalidateQueries({ queryKey: ["shifts-open-preview"] });
      qc.invalidateQueries({ queryKey: ["my-claims"] });
      router.push(`/caregiver/my-shifts`);
    },
    onError: (err: Error) => {
      showToast(err.message, "error");
      void qc.invalidateQueries({ queryKey: ["shifts"] });
      void qc.invalidateQueries({ queryKey: ["shifts-open-preview"] });
    },
  });

  const canClaim =
    allowClaim &&
    shift.status === "OPEN" &&
    !shift.id.startsWith("mock-") &&
    !claim.isPending;

  return (
    <div className="group border-b border-line py-5 transition hover:bg-paper/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={shift.status} />
            <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink">
              {shift.requiredQualification}
            </span>
          </div>
          <Link
            href={href}
            className="block font-display text-xl text-ink group-hover:text-brand-deep"
          >
            {formatDate(shift.date)} · {formatTime(shift.startTime)}–
            {formatTime(shift.endTime)}
          </Link>
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-1.5 text-sm text-brand-deep underline-offset-2 hover:underline"
              title="Open in Maps for distance and directions"
              onClick={(event) => event.stopPropagation()}
            >
              <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {shift.addressLine}, {shift.city}, {shift.state} {shift.zip}
              </span>
            </a>
          ) : (
            <p className="text-sm text-ink-muted">
              {shift.addressLine}, {shift.city}, {shift.state} {shift.zip}
            </p>
          )}
          {shift.notes ? (
            <p className="line-clamp-1 text-sm text-ink-muted">{shift.notes}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 text-right">
          <div>
            {showBillRate ? (
              <>
                <PayRateBadge payRate={Number(shift.billRate ?? 0)} />
                <div className="mt-1 text-xs text-ink-muted">
                  {hours.toFixed(1)} hrs · {formatMoney(Number(shift.billRate ?? 0) * hours)}{" "}
                  bill
                  {(shift.requiredHeadcount ?? 1) > 1 ? (
                    <>
                      {" "}
                      · {shift.filledSlots ?? 0}/{shift.requiredHeadcount} caregivers
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <PayRateBadge payRate={shift.payRate} />
                <div className="mt-1 text-xs text-ink-muted">
                  {hours.toFixed(1)} hrs · {formatMoney(shift.payRate * hours)} pay
                  {(shift.requiredHeadcount ?? 1) > 1 ? (
                    <>
                      {" "}
                      · {shift.filledSlots ?? 0}/{shift.requiredHeadcount} caregivers
                    </>
                  ) : null}
                </div>
              </>
            )}
          </div>
          {canClaim || (allowClaim && shift.status === "OPEN" && claim.isPending) ? (
            <Button
              size="sm"
              disabled={
                !canClaim ||
                (shift.filledSlots ?? 0) >= (shift.requiredHeadcount ?? 1)
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                claim.mutate();
              }}
            >
              <Hand className="h-4 w-4" aria-hidden />
              {claim.isPending
                ? "Claiming…"
                : (shift.filledSlots ?? 0) >= (shift.requiredHeadcount ?? 1)
                  ? "Full"
                  : "Claim"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper/50 px-6 py-14 text-center">
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-16 rounded-md bg-surface-2" />
      <div className="h-16 rounded-md bg-surface-2" />
      <div className="h-16 rounded-md bg-surface-2" />
    </div>
  );
}
