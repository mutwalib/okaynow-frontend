"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  getAgencyRoster,
  inviteAgencyRosterCaregiver,
  suspendAgencyRosterMember,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";

export default function AgencyRosterPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const roster = useQuery({
    queryKey: ["agency-roster"],
    queryFn: getAgencyRoster,
  });

  const invite = useMutation({
    mutationFn: () => inviteAgencyRosterCaregiver(email.trim(), message || undefined),
    onSuccess: () => {
      showToast("Roster invite sent", "success");
      setEmail("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["agency-roster"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const suspend = useMutation({
    mutationFn: suspendAgencyRosterMember,
    onSuccess: () => {
      showToast("Roster member suspended", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-roster"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      showToast("Caregiver email is required", "error");
      return;
    }
    invite.mutate();
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Caregivers</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Agency roster</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Invite caregivers by email. Only active roster members can be assigned to
          your agency shifts.
        </p>
      </section>

      <form onSubmit={onSubmit} className="max-w-md space-y-3 rounded-xl border border-border bg-white p-5">
        <Field label="Caregiver email" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="caregiver@example.com"
          />
        </Field>
        <Field label="Message (optional)">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <Button type="submit" disabled={invite.isPending}>
          {invite.isPending ? "Sending…" : "Send invite"}
        </Button>
      </form>

      <div className="space-y-2">
        {roster.data?.map((m) => (
          <article
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white p-4"
          >
            <div>
              <p className="font-medium">
                {m.caregiverFirstName} {m.caregiverLastName}
              </p>
              <p className="text-sm text-ink-muted">
                {m.caregiverEmail} · {m.status}
              </p>
            </div>
            {m.status === "ACTIVE" ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => suspend.mutate(m.id)}
                disabled={suspend.isPending}
              >
                Suspend
              </Button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
