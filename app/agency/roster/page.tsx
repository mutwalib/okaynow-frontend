"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, IdCard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  acceptAgencyCaregiverInterest,
  declineAgencyCaregiverInterest,
  getAgencyCaregiverInterests,
  getAgencyRoster,
  getAgencyRosterMember,
  inviteAgencyRosterCaregiver,
  lookupAgencyCaregiverByEmail,
  mediaUrl,
  reactivateAgencyRosterMember,
  removeAgencyRosterMember,
  suspendAgencyRosterMember,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { QUALIFICATION_LABELS } from "@/lib/types";
import type { CaregiverLookup } from "@/lib/types";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink break-words">{value}</dd>
    </div>
  );
}

export default function AgencyRosterPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [lookup, setLookup] = useState<CaregiverLookup | null>(null);
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);

  const roster = useQuery({
    queryKey: ["agency-roster"],
    queryFn: getAgencyRoster,
  });
  const interests = useQuery({
    queryKey: ["agency-caregiver-interests"],
    queryFn: getAgencyCaregiverInterests,
  });
  const member = useQuery({
    queryKey: ["agency-roster-member", selectedRosterId],
    queryFn: () => getAgencyRosterMember(selectedRosterId!),
    enabled: !!selectedRosterId,
  });

  const invalidateRoster = () => {
    queryClient.invalidateQueries({ queryKey: ["agency-roster"] });
    queryClient.invalidateQueries({ queryKey: ["agency-roster-member", selectedRosterId] });
  };

  const invite = useMutation({
    mutationFn: () => inviteAgencyRosterCaregiver(email.trim(), message || undefined),
    onSuccess: () => {
      showToast("Roster invite sent", "success");
      setEmail("");
      setMessage("");
      setLookup(null);
      invalidateRoster();
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
      invalidateRoster();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const reactivate = useMutation({
    mutationFn: reactivateAgencyRosterMember,
    onSuccess: () => {
      showToast("Roster member reactivated", "success");
      invalidateRoster();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const remove = useMutation({
    mutationFn: removeAgencyRosterMember,
    onSuccess: () => {
      showToast("Removed from roster (record kept)", "success");
      invalidateRoster();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const acceptInterest = useMutation({
    mutationFn: acceptAgencyCaregiverInterest,
    onSuccess: () => {
      showToast("Caregiver added to roster", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-caregiver-interests"] });
      invalidateRoster();
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
  const detail = member.data;

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Caregivers</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Agency roster</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Search caregivers by email, invite them, review applications, and open
          any roster member for full profile details and CV.
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
          <article key={i.id} className="rounded-xl border border-border bg-white p-4">
            <p className="font-medium">
              {i.caregiverFirstName} {i.caregiverLastName}
            </p>
            <p className="text-sm text-ink-muted">{i.caregiverEmail}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => acceptInterest.mutate(i.id)}>
                Accept to roster
              </Button>
              <Button size="sm" variant="secondary" onClick={() => declineInterest.mutate(i.id)}>
                Decline
              </Button>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <section className="space-y-2">
          <h2 className="font-display text-xl text-ink">Roster</h2>
          {roster.data?.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedRosterId(m.id)}
              className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-4 text-left transition ${
                selectedRosterId === m.id
                  ? "border-brand bg-brand-soft/30"
                  : "border-border hover:border-brand/30"
              } ${m.status === "REMOVED" ? "opacity-70" : ""}`}
            >
              <div>
                <p className="font-medium">
                  {m.caregiverFirstName} {m.caregiverLastName}
                </p>
                <p className="text-sm text-ink-muted">
                  {m.caregiverEmail} · {m.status}
                </p>
              </div>
              <span className="text-xs text-brand-deep">View profile →</span>
            </button>
          ))}
          {!roster.isLoading && (roster.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No roster members yet.</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          {!selectedRosterId ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
              <UserRound className="h-8 w-8 text-ink-muted" aria-hidden />
              <p className="text-sm font-medium">Select a roster member</p>
              <p className="max-w-sm text-sm text-ink-muted">
                Click a caregiver to view photo, qualifications, CV, and roster actions.
              </p>
            </div>
          ) : member.isLoading ? (
            <p className="text-sm text-ink-muted">Loading profile…</p>
          ) : detail ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start gap-4 border-b border-border pb-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-xl font-semibold text-ink-muted">
                  {detail.profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(detail.profilePhotoUrl) ?? detail.profilePhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      {detail.firstName[0]}
                      {detail.lastName[0]}
                    </>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-xl text-ink">
                    {detail.firstName} {detail.lastName}
                  </h3>
                  <p className="text-sm text-ink-muted">{detail.email}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand">
                    Roster: {detail.rosterStatus}
                  </p>
                </div>
              </div>

              <dl className="space-y-1.5">
                <DetailRow label="Phone" value={detail.phone} />
                <DetailRow label="Account" value={detail.accountStatus} />
                <DetailRow
                  label="Qualifications"
                  value={
                    detail.qualifications.length
                      ? detail.qualifications
                          .map((q) =>
                            q === "OTHER" && detail.otherQualificationDetail
                              ? `Other (${detail.otherQualificationDetail})`
                              : QUALIFICATION_LABELS[q] ?? q,
                          )
                          .join(", ")
                      : "None listed"
                  }
                />
                <DetailRow
                  label="Pay range"
                  value={
                    detail.hourlyRateMin != null || detail.hourlyRateMax != null
                      ? `$${detail.hourlyRateMin ?? "—"} – $${detail.hourlyRateMax ?? "—"} /hr`
                      : null
                  }
                />
                <DetailRow
                  label="Service area"
                  value={
                    detail.serviceRadiusMiles != null
                      ? `${detail.serviceRadiusMiles} mi radius`
                      : null
                  }
                />
                <DetailRow
                  label="Address"
                  value={
                    [detail.homeAddressLine, detail.homeCity, detail.homeState, detail.homeZip]
                      .filter(Boolean)
                      .join(", ") || null
                  }
                />
                <DetailRow
                  label="On roster since"
                  value={new Date(detail.invitedAt).toLocaleDateString()}
                />
                {detail.removedAt ? (
                  <DetailRow
                    label="Removed"
                    value={new Date(detail.removedAt).toLocaleDateString()}
                  />
                ) : null}
              </dl>

              <section className="rounded-lg border border-border bg-surface/50 p-3">
                <h4 className="inline-flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4" aria-hidden />
                  CV / resume
                </h4>
                {detail.cvUrl ? (
                  <div className="mt-2">
                    <a
                      href={mediaUrl(detail.cvUrl) ?? detail.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-brand-deep underline"
                    >
                      View uploaded CV
                    </a>
                    {detail.cvUploadedAt ? (
                      <p className="mt-1 text-xs text-ink-muted">
                        Uploaded {new Date(detail.cvUploadedAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">
                    No CV uploaded yet. The caregiver can add one from their profile.
                  </p>
                )}
              </section>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {detail.rosterStatus === "ACTIVE" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={suspend.isPending}
                    onClick={() => suspend.mutate(detail.rosterId)}
                  >
                    Suspend
                  </Button>
                ) : null}
                {detail.rosterStatus === "SUSPENDED" ? (
                  <Button
                    size="sm"
                    disabled={reactivate.isPending}
                    onClick={() => reactivate.mutate(detail.rosterId)}
                  >
                    Unsuspend
                  </Button>
                ) : null}
                {detail.rosterStatus === "ACTIVE" || detail.rosterStatus === "SUSPENDED" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this caregiver from the roster? Their history will be kept.",
                        )
                      ) {
                        remove.mutate(detail.rosterId);
                      }
                    }}
                  >
                    Remove from roster
                  </Button>
                ) : null}
                {detail.rosterStatus === "REMOVED" ? (
                  <p className="text-sm text-ink-muted">
                    Removed from roster. Send a new invite to bring them back.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
