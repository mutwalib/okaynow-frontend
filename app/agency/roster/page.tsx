"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  acceptAgencyCaregiverInterest,
  declineAgencyCaregiverInterest,
  getAgencyCaregiverInterests,
  getAgencyRoster,
  inviteAgencyRosterCaregiver,
  lookupAgencyCaregiverByEmail,
  suspendAgencyRosterMember,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { QUALIFICATION_LABELS } from "@/lib/types";
import type { CaregiverLookup } from "@/lib/types";

export default function AgencyRosterPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [lookup, setLookup] = useState<CaregiverLookup | null>(null);

  const roster = useQuery({
    queryKey: ["agency-roster"],
    queryFn: getAgencyRoster,
  });
  const interests = useQuery({
    queryKey: ["agency-caregiver-interests"],
    queryFn: getAgencyCaregiverInterests,
  });

  const invite = useMutation({
    mutationFn: () => inviteAgencyRosterCaregiver(email.trim(), message || undefined),
    onSuccess: () => {
      showToast("Roster invite sent", "success");
      setEmail("");
      setMessage("");
      setLookup(null);
      queryClient.invalidateQueries({ queryKey: ["agency-roster"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const search = useMutation({
    mutationFn: () => lookupAgencyCaregiverByEmail(email.trim()),
    onSuccess: (data) => {
      setLookup(data);
      showToast("Caregiver profile found", "success");
    },
    onError: (err: Error) => {
      setLookup(null);
      showToast(err.message, "error");
    },
  });

  const suspend = useMutation({
    mutationFn: suspendAgencyRosterMember,
    onSuccess: () => {
      showToast("Roster member suspended", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-roster"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const acceptInterest = useMutation({
    mutationFn: acceptAgencyCaregiverInterest,
    onSuccess: () => {
      showToast("Caregiver added to roster", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-caregiver-interests"] });
      queryClient.invalidateQueries({ queryKey: ["agency-roster"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const declineInterest = useMutation({
    mutationFn: declineAgencyCaregiverInterest,
    onSuccess: () => {
      showToast("Application declined", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-caregiver-interests"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function onInvite(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      showToast("Caregiver email is required", "error");
      return;
    }
    invite.mutate();
  }

  const pendingInterests = (interests.data ?? []).filter((i) => i.status === "PENDING");

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Caregivers</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Agency roster</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Search caregivers by email, invite them, or review caregivers who
          expressed interest while you are hiring.
        </p>
      </section>

      <form onSubmit={onInvite} className="max-w-md space-y-3 rounded-xl border border-border bg-white p-5">
        <Field label="Caregiver email" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="caregiver@example.com"
          />
        </Field>
        <Field label="Invite message (optional)">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={search.isPending || !email.trim()}
            onClick={() => search.mutate()}
          >
            {search.isPending ? "Searching…" : "Look up profile"}
          </Button>
          <Button type="submit" disabled={invite.isPending}>
            {invite.isPending ? "Sending…" : "Send invite"}
          </Button>
        </div>
        {lookup ? (
          <div className="rounded-lg border border-border bg-surface/50 p-3 text-sm">
            <p className="font-medium">
              {lookup.firstName} {lookup.lastName}
            </p>
            <p className="text-ink-muted">{lookup.email}</p>
            <p className="mt-1 text-ink-muted">
              {[lookup.city, lookup.state].filter(Boolean).join(", ") || "Location not set"}
              {lookup.serviceRadiusMiles != null
                ? ` · ${lookup.serviceRadiusMiles} mi radius`
                : ""}
            </p>
            <p className="mt-1 text-ink-muted">
              Quals:{" "}
              {lookup.qualifications.length
                ? lookup.qualifications.map((q) => QUALIFICATION_LABELS[q] ?? q).join(", ")
                : "None listed"}
            </p>
            {lookup.alreadyOnRoster ? (
              <p className="mt-2 text-brand-deep">Already on roster ({lookup.rosterStatus})</p>
            ) : null}
          </div>
        ) : null}
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Caregiver interest</h2>
        {pendingInterests.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No pending applications. Turn on hiring in Directory profile so
            caregivers can apply.
          </p>
        ) : null}
        {pendingInterests.map((i) => (
          <article
            key={i.id}
            className="rounded-xl border border-border bg-white p-4"
          >
            <p className="font-medium">
              {i.caregiverFirstName} {i.caregiverLastName}
            </p>
            <p className="text-sm text-ink-muted">{i.caregiverEmail}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {i.qualifications.map((q) => QUALIFICATION_LABELS[q] ?? q).join(", ") || "No quals listed"}
            </p>
            {i.message ? <p className="mt-2 text-sm">{i.message}</p> : null}
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => acceptInterest.mutate(i.id)}>
                Accept to roster
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => declineInterest.mutate(i.id)}
              >
                Decline
              </Button>
            </div>
          </article>
        ))}
      </section>

      <div className="space-y-2">
        <h2 className="font-display text-xl text-ink">Current roster</h2>
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
