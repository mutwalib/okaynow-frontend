"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { assignAgencyShift, getAgencyRoster, getAgencyShifts } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { QUALIFICATION_LABELS } from "@/lib/types";

export default function AgencyShiftsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [assigningShiftId, setAssigningShiftId] = useState<string | null>(null);
  const [caregiverId, setCaregiverId] = useState("");

  const shifts = useQuery({
    queryKey: ["agency-shifts"],
    queryFn: getAgencyShifts,
  });
  const roster = useQuery({
    queryKey: ["agency-roster"],
    queryFn: getAgencyRoster,
  });

  const activeRoster = (roster.data ?? []).filter((r) => r.status === "ACTIVE");

  const assign = useMutation({
    mutationFn: ({ shiftId, caregiverProfileId }: { shiftId: string; caregiverProfileId: string }) =>
      assignAgencyShift(shiftId, caregiverProfileId),
    onSuccess: () => {
      showToast("Caregiver assigned", "success");
      setAssigningShiftId(null);
      setCaregiverId("");
      queryClient.invalidateQueries({ queryKey: ["agency-shifts"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Schedule</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Agency shifts</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Tenant-owned shifts from accepted home requests. Assign active roster members —
          never posted to the global open board.
        </p>
      </section>

      <div className="space-y-3">
        {shifts.isLoading ? <p className="text-ink-muted">Loading…</p> : null}
        {!shifts.isLoading && (shifts.data?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-ink-muted">
            No agency shifts yet. Accept a home request from the inbox.
          </p>
        ) : null}
        {shifts.data?.map((s) => (
          <article key={s.id} className="rounded-xl border border-border bg-white p-4">
            <p className="font-medium text-ink">
              {s.date} · {QUALIFICATION_LABELS[s.requiredQualification]}
            </p>
            <p className="text-sm text-ink-muted">
              {s.startTime?.slice(0, 5)}–{s.endTime?.slice(0, 5)} · {s.city} · {s.status}
              · {s.filledSlots}/{s.requiredHeadcount} filled
            </p>
            {assigningShiftId === s.id ? (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Field label="Roster caregiver" className="min-w-[200px]">
                  <Select value={caregiverId} onChange={(e) => setCaregiverId(e.target.value)}>
                    <option value="">Select…</option>
                    {activeRoster.map((r) => (
                      <option key={r.id} value={r.caregiverProfileId}>
                        {r.caregiverFirstName} {r.caregiverLastName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button
                  size="sm"
                  disabled={!caregiverId || assign.isPending}
                  onClick={() =>
                    assign.mutate({ shiftId: s.id, caregiverProfileId: caregiverId })
                  }
                >
                  Confirm assign
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setAssigningShiftId(null)}>
                  Cancel
                </Button>
              </div>
            ) : s.filledSlots < s.requiredHeadcount ? (
              <Button className="mt-3" size="sm" onClick={() => setAssigningShiftId(s.id)}>
                Assign from roster
              </Button>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
