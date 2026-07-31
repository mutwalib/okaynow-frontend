"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, Star, UserRound, UserX } from "lucide-react";
import {
  getAssignedCaregivers,
  getClientRates,
  mediaUrl,
  rejectAssignedCaregiver,
} from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { formatMoney } from "@/lib/format";
import type { AssignedCaregiver } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";

export function AssignedCaregiversPanel({
  shiftId,
  canReject = false,
}: {
  shiftId: string;
  canReject?: boolean;
}) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: ["assigned-caregivers", shiftId],
    queryFn: () => getAssignedCaregivers(shiftId),
    enabled: !!shiftId,
  });
  const rates = useQuery({
    queryKey: ["client-rates"],
    queryFn: getClientRates,
    enabled: canReject,
  });
  const rejectionFee = Number(rates.data?.caregiverRejectionFee ?? 0);

  const reject = useMutation({
    mutationFn: ({ claimId, reason }: { claimId: string; reason?: string }) =>
      rejectAssignedCaregiver(shiftId, claimId, reason),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["assigned-caregivers", shiftId] });
      qc.invalidateQueries({ queryKey: ["shift", shiftId] });
      qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
      qc.invalidateQueries({ queryKey: ["shifts"] });
      const fee = Number(result.feeCharged ?? 0);
      showToast(
        fee > 0
          ? `Caregiver rejected — fee invoice ${result.feeInvoiceNumber ?? ""} for ${formatMoney(fee)}`
          : "Caregiver rejected",
        "success",
      );
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (query.isLoading) {
    return (
      <section className="space-y-2">
        <h2 className="font-display text-xl">Who’s coming</h2>
        <p className="text-sm text-ink-muted">Loading caregivers…</p>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section className="space-y-2">
        <h2 className="font-display text-xl">Who’s coming</h2>
        <p className="text-sm text-danger">Could not load assigned caregivers.</p>
      </section>
    );
  }

  const caregivers = query.data ?? [];
  const rejectable = caregivers.filter(
    (c) => c.status === "PENDING" || c.status === "CONFIRMED",
  );

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl">Who’s coming</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Caregivers who claimed or were assigned to this shift.
          {canReject && rejectionFee > 0
            ? ` Rejecting someone costs ${formatMoney(rejectionFee)} (set by the agency).`
            : canReject
              ? " You can reject a caregiver if needed."
              : null}
        </p>
      </div>
      {caregivers.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No caregiver yet. You’ll see their name here once someone claims or is
          assigned.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-paper">
          {caregivers.map((c) => (
            <AssignedCaregiverRow
              key={c.claimId}
              caregiver={c}
              canReject={
                canReject &&
                (c.status === "PENDING" || c.status === "CONFIRMED")
              }
              rejectionFee={rejectionFee}
              busy={reject.isPending}
              onReject={() => {
                const feeNote =
                  rejectionFee > 0
                    ? `\n\nA ${formatMoney(rejectionFee)} fee will be invoiced to you.`
                    : "";
                if (
                  !confirmAction(
                    `Reject ${c.firstName} ${c.lastName} from this shift?${feeNote}`,
                  )
                ) {
                  return;
                }
                reject.mutate({
                  claimId: c.claimId,
                  reason: "Rejected by client",
                });
              }}
            />
          ))}
        </ul>
      )}
      {canReject && rejectable.length > 0 && rejectionFee > 0 ? (
        <p className="text-xs text-ink-muted">
          Rejection fee: {formatMoney(rejectionFee)} per caregiver (agency
          policy).
        </p>
      ) : null}
    </section>
  );
}

function AssignedCaregiverRow({
  caregiver,
  canReject,
  rejectionFee,
  busy,
  onReject,
}: {
  caregiver: AssignedCaregiver;
  canReject: boolean;
  rejectionFee: number;
  busy: boolean;
  onReject: () => void;
}) {
  const photo = mediaUrl(caregiver.profilePhotoUrl);
  const name = `${caregiver.firstName} ${caregiver.lastName}`.trim();
  const quals = caregiver.qualifications?.length
    ? caregiver.qualifications.join(" · ")
    : null;
  const rating =
    caregiver.ratingAvg != null && Number(caregiver.ratingCount) > 0
      ? `${Number(caregiver.ratingAvg).toFixed(1)} (${caregiver.ratingCount})`
      : null;
  const statusLabel =
    caregiver.status === "PENDING"
      ? "Claimed — awaiting confirmation"
      : caregiver.status === "COMPLETED"
        ? "Completed"
        : caregiver.source === "ASSIGNED"
          ? "Assigned"
          : "Confirmed";

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-ink-muted">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserRound className="h-5 w-5" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{name}</p>
        <p className="mt-0.5 text-sm text-ink-muted">
          {quals ?? "Caregiver"} · {statusLabel}
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-ink-muted/80">
          ID {caregiver.caregiverProfileId}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
          {rating ? (
            <span className="inline-flex items-center gap-1">
              <Star
                className="h-3.5 w-3.5 text-brand-deep"
                fill="currentColor"
                aria-hidden
              />
              {rating}
            </span>
          ) : null}
          {caregiver.phone ? (
            <a
              href={`tel:${caregiver.phone}`}
              className="inline-flex items-center gap-1 text-brand-deep underline-offset-2 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {caregiver.phone}
            </a>
          ) : null}
        </div>
      </div>
      {canReject ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={onReject}
          title={
            rejectionFee > 0
              ? `Reject (fee ${formatMoney(rejectionFee)})`
              : "Reject caregiver"
          }
        >
          <UserX className="h-3.5 w-3.5" aria-hidden />
          Reject
        </Button>
      ) : null}
    </li>
  );
}
