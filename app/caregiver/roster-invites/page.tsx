"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Mail } from "lucide-react";
import {
  acceptCaregiverRosterInvite,
  getCaregiverRosterInvites,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";

export default function CaregiverRosterInvitesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const invites = useQuery({
    queryKey: ["caregiver-roster-invites"],
    queryFn: getCaregiverRosterInvites,
  });

  const accept = useMutation({
    mutationFn: acceptCaregiverRosterInvite,
    onSuccess: () => {
      showToast("You joined the agency roster", "success");
      queryClient.invalidateQueries({ queryKey: ["caregiver-roster-invites"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Agencies</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Roster invites</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Home care agencies invite you to their roster before assigning shifts.
          Accept an invite to receive assignments from that agency.
        </p>
      </section>

      <section className="space-y-3">
        {invites.isLoading ? <p className="text-ink-muted">Loading…</p> : null}
        {!invites.isLoading && (invites.data?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <Building2 className="mx-auto h-10 w-10 text-brand/50" aria-hidden />
            <p className="mt-3 font-medium">No pending invites</p>
            <p className="mt-1 text-sm text-ink-muted">
              When an agency invites you, it will appear here.
            </p>
          </div>
        ) : null}
        {invites.data?.map((invite) => (
          <article
            key={invite.id}
            className="rounded-xl border border-border bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{invite.agencyDisplayName}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  Roster invitation
                </p>
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
