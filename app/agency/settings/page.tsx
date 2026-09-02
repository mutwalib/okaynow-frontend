"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
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
  const [qualifications, setQualifications] = useState<Qualification[]>([]);

  useEffect(() => {
    if (!agency.data) return;
    setDisplayName(agency.data.displayName);
    setLegalName(agency.data.legalName);
    setLicenseNumber(agency.data.licenseNumber ?? "");
    setAddressLine(agency.data.addressLine ?? "");
    setCity(agency.data.city ?? "");
    setZip(agency.data.zip ?? "");
    setPublicDescription(agency.data.publicDescription ?? "");
    setDirectoryListed(agency.data.directoryListed);
    setQualifications(agency.data.qualificationsSupported ?? []);
  }, [agency.data]);

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
        qualificationsSupported: qualifications,
      }),
    onSuccess: () => {
      showToast("Directory profile saved", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-me"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function toggleQualification(q: Qualification) {
    setQualifications((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q],
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const zipErr = maZipMessage(zip);
    if (zip && zipErr) {
      showToast(zipErr, "error");
      return;
    }
    save.mutate();
  }

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
      </section>

      <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border border-border bg-white p-6">
        <Field label="Display name" required>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </Field>
        <Field label="Legal name">
          <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
        </Field>
        <Field label="License number">
          <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
        </Field>
        <Field label="Street address">
          <Input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="ZIP">
            <Input value={zip} onChange={(e) => setZip(e.target.value)} />
          </Field>
        </div>
        <Field label="Public description">
          <textarea
            className="w-full rounded-md border border-border p-3 text-sm"
            rows={5}
            value={publicDescription}
            onChange={(e) => setPublicDescription(e.target.value)}
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
            onChange={(e) => setDirectoryListed(e.target.checked)}
          />
          Listed in public directory (requires active subscription)
        </label>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
