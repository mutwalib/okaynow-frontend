"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, UserRound } from "lucide-react";
import { CaregiverVerificationDisclaimer } from "@/components/caregiver-verification-disclaimer";
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
  updateAgencyRosterPayOffer,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import {
  AGENCY_CAREGIVER_STATUS_LABEL,
  QUALIFICATION_LABELS,
  ROSTER_PAY_CLASSIFICATION_LABEL,
  USER_STATUS_LABEL,
  formatPayOffer,
  formatStatusLabel,
} from "@/lib/types";
import type { CaregiverLookup, RosterPayClassification } from "@/lib/types";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink break-words">{value}</dd>
    </div>
  );
}

function PayClassificationPicker({
  value,
  onChange,
  name,
}: {
  value: RosterPayClassification | "";
  onChange: (next: RosterPayClassification) => void;
  name: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">
        Payroll type <span className="text-danger">*</span>
      </legend>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-white p-3 text-sm">
        <input
          type="radio"
          name={name}
          className="mt-1"
          checked={value === "W2"}
          onChange={() => onChange("W2")}
        />
        <span>
          <span className="block font-medium">W-2</span>
          <span className="block text-ink-muted">
            Agency runs payroll with taxes
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-white p-3 text-sm">
        <input
          type="radio"
          name={name}
          className="mt-1"
          checked={value === "NON_W2"}
          onChange={() => onChange("NON_W2")}
        />
        <span>
          <span className="block font-medium">Not W-2</span>
          <span className="block text-ink-muted">
            Other arrangement (not agency W-2 payroll)
          </span>
        </span>
      </label>
    </fieldset>
  );
}

export default function AgencyRosterPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [payRate, setPayRate] = useState("");
  const [payClassification, setPayClassification] = useState<
    RosterPayClassification | ""
  >("W2");
  const [lookup, setLookup] = useState<CaregiverLookup | null>(null);
  const [selectedLookup, setSelectedLookup] = useState(false);
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);
  const [reviseRate, setReviseRate] = useState("");
  const [reviseClassification, setReviseClassification] = useState<
    RosterPayClassification | ""
  >("W2");
  const [interestOffers, setInterestOffers] = useState<
    Record<string, { rate: string; classification: RosterPayClassification | "" }>
  >({});

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

  useEffect(() => {
    if (!member.data) return;
    setReviseRate(
      member.data.agreedPayRate != null ? String(member.data.agreedPayRate) : "",
    );
    setReviseClassification(member.data.payClassification ?? "W2");
  }, [member.data]);

  const invalidateRoster = () => {
    queryClient.invalidateQueries({ queryKey: ["agency-roster"] });
    queryClient.invalidateQueries({ queryKey: ["agency-roster-member", selectedRosterId] });
  };

  const invite = useMutation({
    mutationFn: (opts?: { emailOverride?: string }) =>
      inviteAgencyRosterCaregiver(
        (opts?.emailOverride ?? email).trim(),
        Number(payRate),
        payClassification as RosterPayClassification,
        { message: message || undefined },
      ),
    onSuccess: () => {
      showToast("Roster invite sent — waiting for caregiver to accept", "success");
      setEmail("");
      setMessage("");
      setPayRate("");
      setPayClassification("W2");
      setLookup(null);
      setSelectedLookup(false);
      invalidateRoster();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const search = useMutation({
    mutationFn: () => lookupAgencyCaregiverByEmail(email.trim()),
    onSuccess: (data) => {
      setLookup(data);
      const canInvite = !data.alreadyOnRoster;
      setSelectedLookup(canInvite);
      if (data.alreadyOnRoster) {
        showToast(
          data.rosterStatus === "INVITED"
            ? "Invite already pending for this caregiver"
            : "Caregiver is already on your roster",
          "success",
        );
      } else if (data.canReinvite) {
        showToast("Previously removed — send a new invite they must accept", "success");
      } else {
        showToast("Caregiver found — set their pay offer below", "success");
      }
    },
    onError: (err: Error) => {
      setLookup(null);
      setSelectedLookup(false);
      showToast(err.message, "error");
    },
  });

  const revisePay = useMutation({
    mutationFn: () =>
      updateAgencyRosterPayOffer(
        selectedRosterId!,
        Number(reviseRate),
        reviseClassification as RosterPayClassification,
      ),
    onSuccess: () => {
      showToast("Pay offer updated — caregiver notified", "success");
      invalidateRoster();
    },
    onError: (err: Error) => showToast(err.message, "error"),
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
      showToast("Removed from roster — caregiver notified", "success");
      invalidateRoster();
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const acceptInterest = useMutation({
    mutationFn: ({
      id,
      rate,
      classification,
    }: {
      id: string;
      rate: number;
      classification: RosterPayClassification;
    }) => acceptAgencyCaregiverInterest(id, rate, classification),
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
    if (!lookup || !selectedLookup) {
      showToast("Select the caregiver from the lookup results first", "error");
      return;
    }
    if (lookup.alreadyOnRoster) {
      showToast("This caregiver is already on your roster or has a pending invite", "error");
      return;
    }
    const rate = Number(payRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      showToast("Enter an hourly pay offer greater than 0", "error");
      return;
    }
    if (payClassification !== "W2" && payClassification !== "NON_W2") {
      showToast("Choose W-2 or not W-2", "error");
      return;
    }
    invite.mutate({});
  }

  const pendingInterests = (interests.data ?? []).filter((i) => i.status === "PENDING");
  const detail = member.data;
  const previewRate = Number(payRate);
  const previewOffer =
    Number.isFinite(previewRate) && previewRate > 0 && payClassification
      ? formatPayOffer(previewRate, payClassification)
      : null;

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Caregivers</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Agency roster</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Search caregivers by email, set their agreed hourly offer, invite them, and
          revise or remove as needed. Caregivers see this offer on shifts — not your
          agency default rate.
        </p>
        <div className="mt-4 max-w-xl">
          <CaregiverVerificationDisclaimer audience="agency" />
        </div>
      </section>

      <div className="max-w-md space-y-4 rounded-xl border border-border bg-white p-5">
        <div>
          <h2 className="font-display text-lg text-ink">Invite by email</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Look up the caregiver, then enter their hourly pay offer and send the
            invite. The offer fields appear right after a successful lookup.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) {
              showToast("Caregiver email is required", "error");
              return;
            }
            setMessage("");
            search.mutate();
          }}
          className="space-y-3"
        >
          <Field label="Caregiver email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (lookup) setLookup(null);
              }}
              placeholder="caregiver@example.com"
            />
          </Field>
          <Button
            type="submit"
            variant="secondary"
            disabled={search.isPending || !email.trim()}
          >
            {search.isPending ? "Searching…" : "Look up profile"}
          </Button>
        </form>

        {lookup ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium text-ink">Select caregiver</p>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
                selectedLookup
                  ? "border-brand bg-brand-soft/30"
                  : "border-border bg-surface/50 hover:border-brand/40"
              }`}
            >
              <input
                type="radio"
                name="lookup-caregiver"
                className="mt-1"
                checked={selectedLookup}
                onChange={() => setSelectedLookup(true)}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {lookup.firstName} {lookup.lastName}
                </span>
                <span className="block text-ink-muted">{lookup.email}</span>
                <span className="mt-1 block text-ink-muted">
                  {[lookup.city, lookup.state].filter(Boolean).join(", ") ||
                    "Location not set"}
                </span>
                <span className="mt-1 block text-ink-muted">
                  Quals:{" "}
                  {lookup.qualifications.length
                    ? lookup.qualifications
                        .map((q) => QUALIFICATION_LABELS[q] ?? q)
                        .join(", ")
                    : "None listed"}
                </span>
                {lookup.alreadyOnRoster ? (
                  <span className="mt-2 block text-brand-deep">
                    {lookup.rosterStatus === "INVITED"
                      ? "Invite already pending"
                      : "Already on roster"}{" "}
                    (
                    {formatStatusLabel(
                      lookup.rosterStatus,
                      AGENCY_CAREGIVER_STATUS_LABEL,
                    )}
                    )
                  </span>
                ) : null}
                {lookup.canReinvite ? (
                  <span className="mt-2 block text-brand-deep">
                    Previously removed — send a new invite (they must accept again)
                  </span>
                ) : null}
              </span>
            </label>

            {selectedLookup && !lookup.alreadyOnRoster ? (
              <form onSubmit={onInvite} className="space-y-3 rounded-lg border border-brand/30 bg-brand-soft/20 p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {lookup.canReinvite
                      ? "Re-invite with a new pay offer"
                      : "Pay offer for this caregiver"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {lookup.canReinvite
                      ? "They stay off the roster until they accept this invite."
                      : "Required. Caregivers see this offer on invites and agency shifts — not your agency default rate."}
                  </p>
                </div>
                <Field label="Hourly pay offer ($/hr)" required>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={payRate}
                    onChange={(e) => setPayRate(e.target.value)}
                    placeholder="e.g. 22.00"
                    autoFocus
                  />
                </Field>
                <PayClassificationPicker
                  name="invite-pay-class"
                  value={payClassification}
                  onChange={setPayClassification}
                />
                <Field label="Invite message (optional)">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="We’d like you to join our roster…"
                  />
                </Field>
                {previewOffer ? (
                  <p className="text-xs text-ink-muted">
                    Caregiver will see: “{previewOffer}”
                  </p>
                ) : (
                  <p className="text-xs text-ink-muted">
                    Enter an hourly rate to preview the offer text.
                  </p>
                )}
                <Button type="submit" disabled={invite.isPending}>
                  {invite.isPending
                    ? "Sending…"
                    : lookup.canReinvite
                      ? "Send re-invite"
                      : "Send invite"}
                </Button>
              </form>
            ) : null}

            {selectedLookup && lookup.alreadyOnRoster ? (
              <p className="text-sm text-ink-muted">
                {lookup.rosterStatus === "INVITED"
                  ? "An invite is already pending — open their roster row to cancel or wait for acceptance."
                  : "This caregiver is already on your roster — open their profile to revise pay or remove them."}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Caregiver interest</h2>
        {pendingInterests.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No pending applications. Turn on hiring in Directory profile so
            caregivers can apply.
          </p>
        ) : null}
        {pendingInterests.map((i) => {
          const offer = interestOffers[i.id] ?? { rate: "", classification: "W2" as const };
          return (
            <article key={i.id} className="rounded-xl border border-border bg-white p-4">
              <p className="font-medium">
                {i.caregiverFirstName} {i.caregiverLastName}
              </p>
              <p className="text-sm text-ink-muted">{i.caregiverEmail}</p>
              <div className="mt-3 space-y-3">
                <Field label="Hourly pay offer" required>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={offer.rate}
                    onChange={(e) =>
                      setInterestOffers((prev) => ({
                        ...prev,
                        [i.id]: { ...offer, rate: e.target.value },
                      }))
                    }
                    placeholder="e.g. 22.00"
                  />
                </Field>
                <PayClassificationPicker
                  name={`interest-pay-class-${i.id}`}
                  value={offer.classification}
                  onChange={(classification) =>
                    setInterestOffers((prev) => ({
                      ...prev,
                      [i.id]: { ...offer, classification },
                    }))
                  }
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const rate = Number(offer.rate);
                    if (!Number.isFinite(rate) || rate <= 0) {
                      showToast("Enter an hourly pay offer before accepting", "error");
                      return;
                    }
                    if (offer.classification !== "W2" && offer.classification !== "NON_W2") {
                      showToast("Choose W-2 or not W-2", "error");
                      return;
                    }
                    acceptInterest.mutate({
                      id: i.id,
                      rate,
                      classification: offer.classification,
                    });
                  }}
                >
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
          );
        })}
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
                <p className="text-sm text-ink-muted">{m.caregiverEmail}</p>
                <p className="mt-1 text-sm">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
                      m.status === "INVITED"
                        ? "bg-amber-100 text-amber-900"
                        : m.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-900"
                          : m.status === "SUSPENDED"
                            ? "bg-orange-100 text-orange-900"
                            : "bg-surface text-ink-muted"
                    }`}
                  >
                    {formatStatusLabel(m.status, AGENCY_CAREGIVER_STATUS_LABEL)}
                  </span>
                  {m.agreedPayRate != null
                    ? ` · $${Number(m.agreedPayRate).toFixed(2)}/hr · ${
                        m.payClassification
                          ? ROSTER_PAY_CLASSIFICATION_LABEL[m.payClassification]
                          : "Pay type unset"
                      }`
                    : ""}
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
                Click a caregiver to view photo, qualifications, CV, pay offer, and
                roster actions.
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
                  <p className="mt-1 text-xs font-medium tracking-wide text-brand">
                    Status:{" "}
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
                        detail.rosterStatus === "INVITED"
                          ? "bg-amber-100 text-amber-900"
                          : detail.rosterStatus === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-900"
                            : detail.rosterStatus === "SUSPENDED"
                              ? "bg-orange-100 text-orange-900"
                              : "bg-surface text-ink-muted"
                      }`}
                    >
                      {formatStatusLabel(
                        detail.rosterStatus,
                        AGENCY_CAREGIVER_STATUS_LABEL,
                      )}
                    </span>
                  </p>
                </div>
              </div>

              <dl className="space-y-1.5">
                <DetailRow label="Phone" value={detail.phone} />
                <DetailRow
                  label="Account"
                  value={formatStatusLabel(detail.accountStatus, USER_STATUS_LABEL)}
                />
                <DetailRow
                  label="Agreed pay"
                  value={formatPayOffer(detail.agreedPayRate, detail.payClassification)}
                />
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

              {detail.rosterStatus !== "REMOVED" ? (
                <section className="space-y-3 rounded-lg border border-border bg-surface/50 p-3">
                  <h4 className="text-sm font-semibold">Revise pay offer</h4>
                  <Field label="Hourly rate" required>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={reviseRate}
                      onChange={(e) => setReviseRate(e.target.value)}
                      placeholder="e.g. 22.00"
                    />
                  </Field>
                  <PayClassificationPicker
                    name="revise-pay-class"
                    value={reviseClassification}
                    onChange={setReviseClassification}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={revisePay.isPending}
                    onClick={() => {
                      const rate = Number(reviseRate);
                      if (!Number.isFinite(rate) || rate <= 0) {
                        showToast("Enter a valid hourly rate", "error");
                        return;
                      }
                      if (
                        reviseClassification !== "W2" &&
                        reviseClassification !== "NON_W2"
                      ) {
                        showToast("Choose W-2 or not W-2", "error");
                        return;
                      }
                      revisePay.mutate();
                    }}
                  >
                    {revisePay.isPending ? "Saving…" : "Update offer"}
                  </Button>
                </section>
              ) : null}

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
                {detail.rosterStatus === "ACTIVE" ||
                detail.rosterStatus === "SUSPENDED" ||
                detail.rosterStatus === "INVITED" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={remove.isPending}
                    onClick={() => {
                      const label =
                        detail.rosterStatus === "INVITED"
                          ? "Cancel this pending invite?"
                          : "Remove this caregiver from the roster? Their history will be kept.";
                      if (window.confirm(label)) {
                        remove.mutate(detail.rosterId);
                      }
                    }}
                  >
                    {detail.rosterStatus === "INVITED"
                      ? "Cancel invite"
                      : "Remove from roster"}
                  </Button>
                ) : null}
                {detail.rosterStatus === "REMOVED" ? (
                  <div className="w-full space-y-3 rounded-lg border border-brand/30 bg-brand-soft/20 p-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Invite again</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        They must accept the new invite before returning to your roster.
                      </p>
                    </div>
                    <Field label="Hourly pay offer ($/hr)" required>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={payRate}
                        onChange={(e) => setPayRate(e.target.value)}
                        placeholder="e.g. 22.00"
                      />
                    </Field>
                    <PayClassificationPicker
                      name="reinvite-pay-class"
                      value={payClassification}
                      onChange={setPayClassification}
                    />
                    <Field label="Invite message (optional)">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="We’d like you back on our roster…"
                      />
                    </Field>
                    <Button
                      size="sm"
                      disabled={invite.isPending}
                      onClick={() => {
                        const rate = Number(payRate);
                        if (!Number.isFinite(rate) || rate <= 0) {
                          showToast("Enter an hourly pay offer greater than 0", "error");
                          return;
                        }
                        if (
                          payClassification !== "W2" &&
                          payClassification !== "NON_W2"
                        ) {
                          showToast("Choose W-2 or not W-2", "error");
                          return;
                        }
                        invite.mutate({ emailOverride: detail.email });
                      }}
                    >
                      {invite.isPending ? "Sending…" : "Send re-invite"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
