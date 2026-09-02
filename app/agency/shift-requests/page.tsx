"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  acceptAgencyShiftRequest,
  declineAgencyShiftRequest,
  getAgencyShiftRequestInbox,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { QUALIFICATION_LABELS } from "@/lib/types";

export default function AgencyShiftRequestsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const inbox = useQuery({
    queryKey: ["agency-shift-requests"],
    queryFn: getAgencyShiftRequestInbox,
  });

  const accept = useMutation({
    mutationFn: acceptAgencyShiftRequest,
    onSuccess: () => {
      showToast("Request accepted — shift created as draft", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-shift-requests"] });
      queryClient.invalidateQueries({ queryKey: ["agency-shifts"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const decline = useMutation({
    mutationFn: declineAgencyShiftRequest,
    onSuccess: () => {
      showToast("Request declined", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-shift-requests"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Inbox</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Shift requests</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Care needs from connected homes. Accept to create a tenant shift, then assign
          from your roster.
        </p>
      </section>

      <div className="space-y-3">
        {inbox.isLoading ? <p className="text-ink-muted">Loading…</p> : null}
        {!inbox.isLoading && (inbox.data?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-ink-muted">
            No shift requests yet.
          </p>
        ) : null}
        {inbox.data?.map((row) => (
          <article key={row.id} className="rounded-xl border border-border bg-white p-4">
            <p className="font-medium text-ink">
              {row.clientFirstName} {row.clientLastName}
            </p>
            <p className="text-sm text-ink-muted">
              {QUALIFICATION_LABELS[row.requiredQualification]} · {row.startDate}{" "}
              {row.startTime.slice(0, 5)}–{row.endTime.slice(0, 5)}
              {row.city ? ` · ${row.city}` : ""}
            </p>
            {row.notes ? <p className="mt-2 text-sm text-ink-muted">{row.notes}</p> : null}
            <p className="mt-1 text-xs text-ink-muted">Status: {row.status}</p>
            {row.status === "PENDING" ? (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => accept.mutate(row.id)} disabled={accept.isPending}>
                  Accept & create shift
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => decline.mutate(row.id)}
                  disabled={decline.isPending}
                >
                  Decline
                </Button>
              </div>
            ) : row.createdShiftId ? (
              <p className="mt-2 text-sm text-brand">
                Shift created — assign from{" "}
                <a href="/agency/shifts" className="underline">
                  Agency shifts
                </a>
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
