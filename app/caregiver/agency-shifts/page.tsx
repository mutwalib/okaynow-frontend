"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  claimCaregiverAgencyShift,
  getCaregiverAgencyOpenShifts,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/format";
import { QUALIFICATION_LABELS } from "@/lib/types";

export default function CaregiverAgencyShiftsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const shifts = useQuery({
    queryKey: ["caregiver-agency-open-shifts"],
    queryFn: () => getCaregiverAgencyOpenShifts(),
    refetchInterval: 30_000,
  });

  const claim = useMutation({
    mutationFn: (shiftId: string) => claimCaregiverAgencyShift(shiftId),
    onSuccess: () => {
      showToast("Shift claimed — see My shifts", "success");
      queryClient.invalidateQueries({ queryKey: ["caregiver-agency-open-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Roster</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Agency open shifts</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Shifts your agencies posted to roster caregivers in your service area.
          Pick them up in real time — not the global marketplace.
        </p>
      </section>

      <div className="space-y-3">
        {shifts.isLoading ? <p className="text-ink-muted">Loading…</p> : null}
        {!shifts.isLoading && (shifts.data?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-ink-muted">
            No open roster shifts in your area right now. Agencies broadcast when
            they have coverage needs from connected homes.
          </p>
        ) : null}
        {shifts.data?.map((s) => (
          <article
            key={s.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="inline-flex items-center gap-1.5 font-medium text-ink">
                <Zap className="h-4 w-4 text-brand" aria-hidden />
                {formatDate(s.date)} · {QUALIFICATION_LABELS[s.requiredQualification]}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {s.startTime?.slice(0, 5)}–{s.endTime?.slice(0, 5)}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-muted">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {s.city}, {s.state} {s.zip}
              </p>
              {s.payRate != null ? (
                <p className="mt-1 text-sm font-medium text-ink">${s.payRate}/hr pay</p>
              ) : null}
            </div>
            <Button
              disabled={claim.isPending}
              onClick={() => claim.mutate(s.id)}
            >
              {claim.isPending ? "Claiming…" : "Claim shift"}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
