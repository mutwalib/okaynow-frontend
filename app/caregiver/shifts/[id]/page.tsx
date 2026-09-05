"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Hand, Undo2 } from "lucide-react";
import { claimCaregiverAgencyShift, claimShift, getMyClaims, getShift, releaseShift, acceptShiftInvite, declineShiftInvite } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { MOCK_SHIFTS } from "@/lib/mockShifts";
import { formatDate, formatMoney, formatTime, shiftHours } from "@/lib/format";
import { AddressLink } from "@/components/address-link";
import { PayRateBadge, StatusBadge } from "@/components/ui/badges";
import { Button, ButtonLink } from "@/components/ui/button";
import { useToast } from "@/lib/toast-context";
import type { ShiftClaimStatus } from "@/lib/types";

function claimButtonLabel(status: ShiftClaimStatus): string {
  switch (status) {
    case "PENDING":
      return "PENDING";
    case "CONFIRMED":
      return "CONFIRMED";
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return status;
  }
}

export default function CaregiverShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["shift", id],
    queryFn: async () => {
      try {
        return await getShift(id);
      } catch {
        const mock = MOCK_SHIFTS.find((s) => s.id === id);
        if (!mock) throw new Error("Shift not found");
        return mock;
      }
    },
  });

  const claimsQuery = useQuery({
    queryKey: ["my-claims"],
    queryFn: () => getMyClaims(),
    enabled: !id.startsWith("mock-"),
  });

  const myClaim = claimsQuery.data?.content.find((c) => c.shift.id === id);

  const claim = useMutation({
    mutationFn: () =>
      query.data?.agencyId
        ? claimCaregiverAgencyShift(id)
        : claimShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["caregiver-agency-open-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
      showToast(
        query.data?.agencyId
          ? "Shift claimed from your agency roster."
          : "Shift claimed. OkayNow can confirm your assignment.",
        "success",
      );
      router.push("/caregiver/my-shifts");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const release = useMutation({
    mutationFn: () => releaseShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
      showToast("Shift released.", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const acceptInvite = useMutation({
    mutationFn: () => acceptShiftInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
      showToast("Invitation accepted.", "success");
      router.push("/caregiver/my-shifts");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const declineInvite = useMutation({
    mutationFn: () => declineShiftInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shift", id] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
      showToast("Invitation declined.", "success");
      router.push("/caregiver/shifts");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  if (query.isLoading) {
    return <p className="text-ink-muted">Loading shift…</p>;
  }

  if (query.isError || !query.data) {
    return (
      <div>
        <p className="text-danger">Shift not found.</p>
        <ButtonLink href="/caregiver/shifts" variant="secondary" className="mt-4">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to board
        </ButtonLink>
      </div>
    );
  }

  const shift = query.data;
  const hours = shiftHours(shift);
  const isMine = !!myClaim;
  const canClaim =
    !isMine &&
    shift.status === "OPEN" &&
    !claim.isPending &&
    !id.startsWith("mock-");

  let primaryLabel: string;
  if (id.startsWith("mock-")) {
    primaryLabel = "Sample shift";
  } else if (claim.isPending) {
    primaryLabel = "Claiming…";
  } else if (isMine) {
    primaryLabel = claimButtonLabel(myClaim.status);
  } else if (shift.status === "OPEN") {
    primaryLabel = "Claim shift";
  } else {
    primaryLabel = "Not available to claim";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-rise">
      <ButtonLink href="/caregiver/shifts" variant="ghost" className="px-0">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Open shifts
      </ButtonLink>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={shift.status} />
          {isMine ? (
            <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand-deep">
              {myClaim.source === "ASSIGNED"
                ? `Assigned to you · ${myClaim.status}`
                : myClaim.source === "INVITE"
                  ? `Private invite · ${myClaim.status}`
                  : `Your claim · ${myClaim.status}`}
            </span>
          ) : null}
          <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold">
            {shift.requiredQualification}
          </span>
          {shift.agencyDisplayName ? (
            <span className="rounded border border-brand/30 bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-deep">
              {shift.agencyDisplayName}
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-4xl text-ink">
          {formatDate(shift.date)}
        </h1>
        <p className="text-lg text-ink-muted">
          {formatTime(shift.startTime)} – {formatTime(shift.endTime)} ·{" "}
          {hours.toFixed(1)} hours
        </p>
      </div>

      <div className="rounded-lg border border-line bg-paper p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Your pay
            </p>
            <PayRateBadge payRate={shift.payRate} />
          </div>
          <p className="text-sm text-ink-muted">
            Est. {formatMoney(Number(shift.payRate ?? 0) * hours)} for this shift
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl text-ink">Location</h2>
        <div className="mt-2">
          <AddressLink address={shift} className="text-ink-muted" />
        </div>
      </div>

      {shift.notes ? (
        <div>
          <h2 className="font-display text-xl text-ink">Care notes</h2>
          <p className="mt-2 text-ink-muted whitespace-pre-wrap">{shift.notes}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        {isMine && myClaim.source === "INVITE" && myClaim.status === "PENDING" ? (
          <>
            <Button
              size="lg"
              disabled={acceptInvite.isPending || declineInvite.isPending}
              onClick={() => acceptInvite.mutate()}
            >
              <Hand className="h-5 w-5" aria-hidden />
              {acceptInvite.isPending ? "Accepting…" : "Accept invite"}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={acceptInvite.isPending || declineInvite.isPending}
              onClick={() => {
                if (confirmAction("Decline this private invitation?")) {
                  declineInvite.mutate();
                }
              }}
            >
              {declineInvite.isPending ? "Declining…" : "Decline"}
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            disabled={!canClaim}
            onClick={() => claim.mutate()}
            variant={isMine ? "secondary" : "primary"}
          >
            {!isMine && (primaryLabel === "Claim shift" || claim.isPending) ? (
              <Hand className="h-5 w-5" aria-hidden />
            ) : null}
            {primaryLabel}
          </Button>
        )}
        {isMine &&
        myClaim.status === "PENDING" &&
        myClaim.source !== "INVITE" ? (
          <Button
            size="lg"
            variant="ghost"
            disabled={release.isPending}
            onClick={() => {
              if (
                confirmAction(
                  "Release this shift claim? It will go back on the open board for others.",
                )
              ) {
                release.mutate();
              }
            }}
          >
            <Undo2 className="h-5 w-5" aria-hidden />
            {release.isPending ? "Releasing…" : "Release shift"}
          </Button>
        ) : null}
        {isMine ? (
          <ButtonLink href="/caregiver/my-shifts" variant="secondary" size="lg">
            My shifts
          </ButtonLink>
        ) : (
          <ButtonLink href="/caregiver/shifts" variant="secondary" size="lg">
            Keep browsing
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
