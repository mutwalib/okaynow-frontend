"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin } from "lucide-react";
import {
  expressCaregiverAgencyInterest,
  getCaregiverAgencyInterests,
  searchAgencyDirectory,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { QUALIFICATION_LABELS } from "@/lib/types";

export default function CaregiverFindAgenciesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [appliedZip, setAppliedZip] = useState("");
  const [message, setMessage] = useState("");
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);

  const hiring = useQuery({
    queryKey: ["hiring-agencies", appliedCity, appliedZip],
    queryFn: () =>
      searchAgencyDirectory({
        hiringOnly: true,
        city: appliedCity || undefined,
        zip: appliedZip || undefined,
      }),
  });

  const myInterests = useQuery({
    queryKey: ["caregiver-agency-interests"],
    queryFn: getCaregiverAgencyInterests,
  });

  const apply = useMutation({
    mutationFn: () =>
      expressCaregiverAgencyInterest(selectedAgencyId!, message.trim() || undefined),
    onSuccess: () => {
      showToast("Interest sent to the agency", "success");
      setMessage("");
      setSelectedAgencyId(null);
      queryClient.invalidateQueries({ queryKey: ["caregiver-agency-interests"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const appliedIds = new Set(
    (myInterests.data ?? [])
      .filter((i) => i.status === "PENDING" || i.status === "ACCEPTED")
      .map((i) => i.agencyId),
  );

  function onApply(e: FormEvent) {
    e.preventDefault();
    if (!selectedAgencyId) {
      showToast("Select an agency first", "error");
      return;
    }
    apply.mutate();
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Hiring</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Find agencies</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Browse agencies that are hiring caregivers. Express interest and they
          can review your profile and add you to their roster.
        </p>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="City">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Boston"
          />
        </Field>
        <Field label="ZIP">
          <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="02108" />
        </Field>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setAppliedCity(city.trim());
            setAppliedZip(zip.trim());
          }}
        >
          Search
        </Button>
      </div>

      <section className="space-y-3">
        {hiring.isLoading ? <p className="text-ink-muted">Loading…</p> : null}
        {!hiring.isLoading && (hiring.data?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <Building2 className="mx-auto h-10 w-10 text-brand/50" aria-hidden />
            <p className="mt-3 font-medium">No open hiring listings</p>
            <p className="mt-1 text-sm text-ink-muted">
              Try another city/ZIP, or wait for agencies to open hiring.
            </p>
          </div>
        ) : null}
        {hiring.data?.map((agency) => {
          const already = appliedIds.has(agency.id);
          return (
            <article key={agency.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{agency.displayName}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {[agency.city, agency.state, agency.zip].filter(Boolean).join(", ") || "MA"}
                  </p>
                  {agency.hiringNote ? (
                    <p className="mt-2 text-sm text-ink-muted">{agency.hiringNote}</p>
                  ) : null}
                  {agency.qualificationsSupported?.length ? (
                    <p className="mt-2 text-xs text-ink-muted">
                      Looking for:{" "}
                      {agency.qualificationsSupported
                        .map((q) => QUALIFICATION_LABELS[q] ?? q)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant={selectedAgencyId === agency.id ? "primary" : "secondary"}
                  disabled={already}
                  onClick={() => setSelectedAgencyId(agency.id)}
                >
                  {already ? "Applied" : selectedAgencyId === agency.id ? "Selected" : "Apply"}
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      {selectedAgencyId ? (
        <form onSubmit={onApply} className="max-w-lg space-y-3 rounded-xl border border-border bg-white p-5">
          <Field label="Message to the agency (optional)">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Qualifications, availability, service area…"
            />
          </Field>
          <Button type="submit" disabled={apply.isPending}>
            {apply.isPending ? "Sending…" : "Send interest"}
          </Button>
        </form>
      ) : null}

      {(myInterests.data?.length ?? 0) > 0 ? (
        <section className="space-y-2">
          <h2 className="font-display text-xl text-ink">Your applications</h2>
          {myInterests.data?.map((i) => (
            <p key={i.id} className="text-sm text-ink-muted">
              {i.agencyDisplayName}: {i.status}
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
