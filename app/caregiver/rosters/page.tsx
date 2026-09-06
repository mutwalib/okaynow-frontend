"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Mail } from "lucide-react";
import {
  acceptCaregiverRosterInvite,
  getCaregiverRosterInvites,
  getCaregiverRosters,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  AGENCY_CAREGIVER_STATUS_LABEL,
  formatStatusLabel,
} from "@/lib/types";

function offerLine(rate: number | null, note: string | null) {
  if (rate == null) return null;
  const base = `The offer is $${Number(rate).toFixed(2)} per hour`;
  return note ? `${base} (${note}).` : `${base}.`;
}

export default function CaregiverRostersPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const rosters = useQuery({
    queryKey: ["caregiver-rosters"],
    queryFn: getCaregiverRosters,
  });
  const invites = useQuery({
    queryKey: ["caregiver-roster-invites"],
    queryFn: getCaregiverRosterInvites,
  });

  const accept = useMutation({
    mutationFn: acceptCaregiverRosterInvite,
    onSuccess: () => {
      showToast("You joined the agency roster", "success");
      queryClient.invalidateQueries({ queryKey: ["caregiver-roster-invites"] });
      queryClient.invalidateQueries({ queryKey: ["caregiver-rosters"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const memberships = (rosters.data ?? []).filter((r) => r.status !== "INVITED");
  const pending = invites.data ?? [];

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Agencies</p>
        <h1 className="mt-1 font-display text-3xl text-ink">My Agencies</h1>
        <ButtonLink href="/caregiver/find-agencies" className="mt-4" variant="secondary">
          Find agencies hiring
        </ButtonLink>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Active &amp; suspended</h2>
        {rosters.isLoading ? <p className="text-ink-muted">Loading…</p> : null}
        {!rosters.isLoading && memberships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <Building2 className="mx-auto h-10 w-10 text-brand/50" aria-hidden />
            <p className="mt-3 font-medium">Not on any roster yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Accept an invite or apply to agencies that are hiring.
            </p>
          </div>
        ) : null}
        {memberships.map((m) => (
          <article key={m.id} className="rounded-xl border border-border bg-white p-4">
            <p className="font-medium text-ink">{m.agencyDisplayName}</p>
            <p className="text-sm text-ink-muted">
              Status: {formatStatusLabel(m.status, AGENCY_CAREGIVER_STATUS_LABEL)}
            </p>
            {offerLine(m.agreedPayRate, m.payOfferNote) ? (
              <p className="mt-2 text-sm text-ink">{offerLine(m.agreedPayRate, m.payOfferNote)}</p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Pending invites</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-ink-muted">No pending invites.</p>
        ) : null}
        {pending.map((invite) => (
          <article key={invite.id} className="rounded-xl border border-border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{invite.agencyDisplayName}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  Roster invitation
                </p>
                {offerLine(invite.agreedPayRate, invite.payOfferNote) ? (
                  <p className="mt-2 text-sm font-medium text-ink">
                    {offerLine(invite.agreedPayRate, invite.payOfferNote)}
                  </p>
                ) : null}
                {invite.inviteMessage ? (
                  <p className="mt-2 text-sm text-ink-muted">{invite.inviteMessage}</p>
                ) : null}
              </div>
              <Button
                size="sm"
                onClick={() => accept.mutate(invite.id)}
                disabled={accept.isPending}
              >
                {accept.isPending ? "Accepting…" : "Accept invite"}
              </Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
