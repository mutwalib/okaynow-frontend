"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  acceptAgencyConnection,
  endAgencyConnectionAsAgency,
  getAgencyConnections,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { CONNECTION_STATUS_LABEL } from "@/lib/types";

export default function AgencyConnectionsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const connections = useQuery({
    queryKey: ["agency-connections"],
    queryFn: getAgencyConnections,
  });

  const accept = useMutation({
    mutationFn: acceptAgencyConnection,
    onSuccess: () => {
      showToast("Connection accepted", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-connections"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const end = useMutation({
    mutationFn: endAgencyConnectionAsAgency,
    onSuccess: () => {
      showToast("Connection ended", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-connections"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Homes &amp; facilities
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">Connection requests</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Accept families and facility sites that want to work with your agency.
        </p>
      </section>

      <div className="space-y-3">
        {connections.isLoading ? (
          <p className="text-ink-muted">Loading…</p>
        ) : null}
        {!connections.isLoading && (connections.data?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-ink-muted">
            No connection requests yet.
          </p>
        ) : null}
        {connections.data?.map((c) => (
          <article
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4"
          >
            <div>
              <p className="font-medium text-ink">
                {[c.homeFirstName, c.homeLastName].filter(Boolean).join(" ") ||
                  "Connected account"}
              </p>
              <p className="text-sm text-ink-muted">
                {CONNECTION_STATUS_LABEL[c.status]}
                {c.homeMessage ? ` · “${c.homeMessage}”` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {c.status === "PENDING" ? (
                <Button
                  size="sm"
                  onClick={() => accept.mutate(c.id)}
                  disabled={accept.isPending}
                >
                  Accept
                </Button>
              ) : null}
              {c.status === "ACTIVE" || c.status === "PENDING" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => end.mutate(c.id)}
                  disabled={end.isPending}
                >
                  End
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
