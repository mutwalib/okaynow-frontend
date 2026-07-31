"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptLegalDocuments,
  getLegalAcceptanceStatus,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast-context";

/** Blocks the app until the signed-in user accepts the latest published policies. */
export function LegalAcceptanceGate({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const status = useQuery({
    queryKey: ["legal-acceptance-status"],
    queryFn: getLegalAcceptanceStatus,
  });

  const accept = useMutation({
    mutationFn: () =>
      acceptLegalDocuments((status.data?.pending ?? []).map((d) => d.id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legal-acceptance-status"] });
      showToast("Policies accepted", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (status.isLoading) {
    return <p className="p-6 text-sm text-ink-muted">Checking policies…</p>;
  }

  if (status.data && !status.data.upToDate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-paper p-5 shadow-lg">
          <h2 className="font-display text-2xl text-ink">Updated policies</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Please review and accept the latest OkayNow policies to continue.
            These include rules against false no-shows and the platform
            conversion fee for off-platform hires.
          </p>
          <div className="mt-4 space-y-4">
            {status.data.pending.map((doc) => (
              <article key={doc.id} className="rounded border border-line p-3">
                <h3 className="font-medium text-ink">
                  {doc.title}{" "}
                  <span className="text-xs text-ink-muted">v{doc.version}</span>
                </h3>
                <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-ink-muted">
                  {doc.body}
                </pre>
              </article>
            ))}
          </div>
          <Button
            className="mt-4 w-full"
            disabled={accept.isPending}
            onClick={() => accept.mutate()}
          >
            {accept.isPending ? "Saving…" : "I agree to all updated policies"}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
