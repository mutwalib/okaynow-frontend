"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMyAccount } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";

type Props = {
  /** Extra warning for caregivers who may have claimed shifts. */
  roleHint?: string;
};

export function DeleteAccountSection({ roleHint }: Props) {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState<"idle" | "confirm">("idle");

  const del = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      qc.clear();
      showToast("Your account has been deleted", "success");
      logout();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <section className="space-y-3 rounded-lg border border-danger/30 bg-paper p-5">
      <h2 className="font-display text-xl text-ink">Delete account</h2>
      <p className="text-sm text-ink-muted">
        Deleting your account permanently disables sign-in and removes your
        profile from OkayNow. Historical visit, scheduling, and billing records
        may be retained as required by law.
        {roleHint ? ` ${roleHint}` : null}
      </p>

      {step === "idle" ? (
        <Button type="button" variant="danger" onClick={() => setStep("confirm")}>
          Delete account
        </Button>
      ) : (
        <div className="space-y-3 rounded-md border border-line bg-surface p-4">
          <p className="text-sm font-medium text-ink">
            Are you sure? This cannot be undone.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="danger"
              disabled={del.isPending}
              onClick={() => del.mutate()}
            >
              {del.isPending ? "Deleting…" : "Yes, delete permanently"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={del.isPending}
              onClick={() => setStep("idle")}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
