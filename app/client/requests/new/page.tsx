"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import {
  createHomeShiftRequest,
  getHomeAgencyConnections,
  getMyClientProfile,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import {
  QUALIFICATIONS,
  QUALIFICATION_LABELS,
  type Qualification,
} from "@/lib/types";
import { DEFAULT_STATE } from "@/lib/service-region";

export default function NewShiftRequestPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const connections = useQuery({
    queryKey: ["home-agency-connections"],
    queryFn: getHomeAgencyConnections,
  });
  const profile = useQuery({
    queryKey: ["client-profile"],
    queryFn: getMyClientProfile,
  });

  const activeAgencies = useMemo(
    () => (connections.data ?? []).filter((c) => c.status === "ACTIVE"),
    [connections.data],
  );

  const [qualification, setQualification] = useState<Qualification>("PCA");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);

  const submit = useMutation({
    mutationFn: () =>
      createHomeShiftRequest({
        requiredQualification: qualification,
        startDate,
        endDate: endDate || undefined,
        startTime,
        endTime,
        notes: notes || undefined,
        agencyIds: selectedAgencies,
      }),
    onSuccess: () => {
      showToast("Care need sent to selected agencies", "success");
      router.push("/client/requests");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function toggleAgency(id: string) {
    setSelectedAgencies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!startDate) {
      showToast("Start date is required", "error");
      return;
    }
    if (selectedAgencies.length === 0) {
      showToast("Select at least one connected agency", "error");
      return;
    }
    submit.mutate();
  }

  return (
    <div className="max-w-xl space-y-6">
      <section>
        <h1 className="font-display text-3xl text-ink">Post a care need</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Routed only to agencies you select below — not a public shift board.
        </p>
      </section>

      {activeAgencies.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Connect with at least one agency before posting a request.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-white p-6">
        <Field label="Qualification needed">
          <Select
            value={qualification}
            onChange={(e) => setQualification(e.target.value as Qualification)}
          >
            {QUALIFICATIONS.map((q) => (
              <option key={q} value={q}>
                {QUALIFICATION_LABELS[q]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" required>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </Field>
          <Field label="End date (optional)">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start time">
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="End time">
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            className="w-full rounded-md border border-border p-3 text-sm"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Care tasks, mobility needs, schedule preferences…"
          />
        </Field>
        <fieldset>
          <legend className="text-sm font-medium text-ink">Send to agencies</legend>
          <div className="mt-2 space-y-2">
            {activeAgencies.map((a) => (
              <label key={a.agencyId} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedAgencies.includes(a.agencyId)}
                  onChange={() => toggleAgency(a.agencyId)}
                />
                {a.agencyDisplayName}
              </label>
            ))}
          </div>
        </fieldset>
        {profile.data?.addressLine ? (
          <p className="text-xs text-ink-muted">
            Service address from profile: {profile.data.addressLine}, {profile.data.city}{" "}
            {profile.data.zip ?? ""} ({DEFAULT_STATE})
          </p>
        ) : null}
        <Button type="submit" disabled={submit.isPending || activeAgencies.length === 0}>
          {submit.isPending ? "Sending…" : "Send request"}
        </Button>
      </form>
    </div>
  );
}
