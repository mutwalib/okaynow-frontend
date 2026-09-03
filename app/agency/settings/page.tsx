"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { LoadingBlock } from "@/components/shift-card";
import { getMyAgency, updateAgencyDirectoryProfile } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import {
  DEFAULT_STATE,
  maZipMessage,
} from "@/lib/service-region";
import {
  QUALIFICATION_LABELS,
  QUALIFICATIONS,
  type Qualification,
} from "@/lib/types";

export default function AgencySettingsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const agency = useQuery({ queryKey: ["agency-me"], queryFn: getMyAgency });

  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [publicDescription, setPublicDescription] = useState("");
  const [directoryListed, setDirectoryListed] = useState(false);
  const [hiringOpen, setHiringOpen] = useState(false);
  const [hiringNote, setHiringNote] = useState("");
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!agency.data || dirty) return;
    setDisplayName(agency.data.displayName);
    setLegalName(agency.data.legalName);
    setLicenseNumber(agency.data.licenseNumber ?? "");
    setAddressLine(agency.data.addressLine ?? "");
    setCity(agency.data.city ?? "");
    setZip(agency.data.zip ?? "");
    setPublicDescription(agency.data.publicDescription ?? "");
    setDirectoryListed(agency.data.directoryListed);
    setHiringOpen(agency.data.hiringOpen ?? false);
    setHiringNote(agency.data.hiringNote ?? "");
    setQualifications(agency.data.qualificationsSupported ?? []);
  }, [agency.data, dirty]);

  const save = useMutation({
    mutationFn: () =>
      updateAgencyDirectoryProfile({
        displayName,
        legalName: legalName || undefined,
        licenseNumber: licenseNumber || undefined,
        addressLine: addressLine || undefined,
        city: city || undefined,
        state: DEFAULT_STATE,
        zip: zip || undefined,
        publicDescription: publicDescription || undefined,
        directoryListed,
        hiringOpen,
        hiringNote: hiringNote.trim() || null,
        qualificationsSupported: qualifications,
      }),
    onSuccess: (saved) => {
      setDirty(false);
      showToast("Directory profile saved", "success");
      queryClient.setQueryData(["agency-me"], saved);
      queryClient.invalidateQueries({ queryKey: ["agency-me"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function updateField<T>(setter: (value: T) => void, value: T) {
    setDirty(true);
    setter(value);
  }

  function toggleQualification(q: Qualification) {
    setDirty(true);
    setQualifications((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q],
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const zipErr = maZipMessage(zip);
    if (zip && zipErr !== true) {
      showToast(zipErr, "error");
      return;
    }
    save.mutate();
  }

  if (agency.isLoading) {
    return <LoadingBlock />;
  }

  if (agency.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p className="font-medium">Could not load your agency profile.</p>
        <p className="mt-2">{agency.error.message}</p>
      </div>
    );
  }

  const listedLive =
    agency.data?.directoryListed &&
    (agency.data.subscriptionStatus === "ACTIVE" ||
      agency.data.subscriptionStatus === "TRIAL");

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Public listing
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">Directory profile</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          What homes see when browsing agencies. Listing requires an active
          subscription and “Listed in directory” enabled.
        </p>
        {agency.data ? (
          <p className="mt-3 text-sm text-ink-muted">
            Subscription:{" "}
            <span className="font-medium text-ink">
              {agency.data.subscriptionStatus}
            </span>
            {listedLive && agency.data.slug ? (
              <>
                {" "}
                ·{" "}
                <Link
                  href={`/agencies/${agency.data.slug}`}
                  className="font-medium text-brand hover:underline"
                >
                  View public profile
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
      </section>

      <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border border-border bg-white p-6">
        <Field label="Display name" required>
          <Input
            value={displayName}
            onChange={(e) => updateField(setDisplayName, e.target.value)}
            required
          />
        </Field>
        <Field label="Legal name">
          <Input
            value={legalName}
            onChange={(e) => updateField(setLegalName, e.target.value)}
          />
        </Field>
        <Field label="License number">
          <Input
            value={licenseNumber}
            onChange={(e) => updateField(setLicenseNumber, e.target.value)}
          />
        </Field>
        <Field label="Street address">
          <Input
            value={addressLine}
            onChange={(e) => updateField(setAddressLine, e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <Input
              value={city}
              onChange={(e) => updateField(setCity, e.target.value)}
            />
          </Field>
          <Field label="ZIP">
            <Input value={zip} onChange={(e) => updateField(setZip, e.target.value)} />
          </Field>
        </div>
        <Field label="Public description">
          <textarea
            className="w-full rounded-md border border-border p-3 text-sm"
            rows={5}
            value={publicDescription}
            onChange={(e) => updateField(setPublicDescription, e.target.value)}
          />
        </Field>
        <fieldset>
          <legend className="text-sm font-medium text-ink">Qualifications offered</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUALIFICATIONS.map((q) => (
              <label
                key={q}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                  qualifications.includes(q)
                    ? "border-brand bg-brand-soft text-brand-deep"
                    : "border-border text-ink-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={qualifications.includes(q)}
                  onChange={() => toggleQualification(q)}
                />
                {QUALIFICATION_LABELS[q]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={directoryListed}
            onChange={(e) => updateField(setDirectoryListed, e.target.checked)}
          />
          Listed in public directory (requires active subscription)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hiringOpen}
            onChange={(e) => updateField(setHiringOpen, e.target.checked)}
          />
          Open to caregiver applications (shown in caregiver Find agencies)
        </label>
        {hiringOpen ? (
          <Field label="Hiring note (optional)">
            <Input
              value={hiringNote}
              onChange={(e) => updateField(setHiringNote, e.target.value)}
              placeholder="e.g. Seeking HHAs for evenings in Middlesex County"
            />
          </Field>
        ) : null}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
