"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import {
  assignAgencyShift,
  broadcastAgencyShift,
  getAgencyRoster,
  getAgencyShifts,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { formatDate } from "@/lib/format";
import { QUALIFICATION_LABELS } from "@/lib/types";

export default function AgencyShiftsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [assigningShiftId, setAssigningShiftId] = useState<string | null>(null);
  const [broadcastingShiftId, setBroadcastingShiftId] = useState<string | null>(null);
  const [caregiverId, setCaregiverId] = useState("");
  const [inviteIds, setInviteIds] = useState<string[]>([]);

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

  const broadcast = useMutation({
    mutationFn: ({
      shiftId,
      caregiverProfileIds,
    }: {
      shiftId: string;
      caregiverProfileIds?: string[];
    }) => broadcastAgencyShift(shiftId, caregiverProfileIds),
    onSuccess: (result) => {
      const msg =
        result.mode === "INVITED"
          ? `Invited ${result.recipientsNotified} caregiver(s)`
          : `Posted to ${result.recipientsNotified} roster caregiver(s) in the service area`;
      showToast(msg, "success");
      setBroadcastingShiftId(null);
      setInviteIds([]);
      queryClient.invalidateQueries({ queryKey: ["agency-shifts"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function toggleInvite(id: string) {
    setInviteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Schedule</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Agency shifts</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Shifts opened for coverage or already assigned, including accepted home
          requests. Broadcast to roster caregivers in the service area so they can
          pick shifts in real time, invite specific people, or assign directly.
          Drafts on Home schedules stay there until you open them.
        </p>
      </section>

      <div className="space-y-3">
        {shifts.isLoading ? <p className="text-ink-muted">Loading…</p> : null}
        {!shifts.isLoading && (shifts.data?.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-ink-muted">
            No open or assigned shifts yet. Accept a home request from the inbox,
            or open a Home schedule draft to your roster.
          </p>
        ) : null}
        {shifts.data?.map((s) => {
          const needsStaff = s.filledSlots < s.requiredHeadcount;
          const isOpen = s.status === "OPEN" && s.marketplacePosted;
          return (
            <article key={s.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">
                    {formatDate(s.date)} · {QUALIFICATION_LABELS[s.requiredQualification]}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {s.startTime?.slice(0, 5)}–{s.endTime?.slice(0, 5)} · {s.city} ·{" "}
                    {s.status}
                    {isOpen ? " · open to roster" : ""}
                    · {s.filledSlots}/{s.requiredHeadcount} filled
                  </p>
                </div>
              </div>

              {broadcastingShiftId === s.id ? (
                <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface/50 p-4">
                  <p className="text-sm font-medium text-ink">Broadcast options</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={broadcast.isPending}
                    onClick={() => broadcast.mutate({ shiftId: s.id })}
                  >
                    <Megaphone className="h-3.5 w-3.5" aria-hidden />
                    Post to all roster in area
                  </Button>
                  <div>
                    <p className="text-xs font-medium text-ink-muted">
                      Or invite specific caregivers
                    </p>
                    <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {activeRoster.map((r) => (
                        <li key={r.id}>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={inviteIds.includes(r.caregiverProfileId)}
                              onChange={() => toggleInvite(r.caregiverProfileId)}
                            />
                            {r.caregiverFirstName} {r.caregiverLastName}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-2"
                      size="sm"
                      disabled={inviteIds.length === 0 || broadcast.isPending}
                      onClick={() =>
                        broadcast.mutate({
                          shiftId: s.id,
                          caregiverProfileIds: inviteIds,
                        })
                      }
                    >
                      Send invites ({inviteIds.length})
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setBroadcastingShiftId(null);
                      setInviteIds([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : assigningShiftId === s.id ? (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <Field label="Assign caregiver" className="min-w-[200px]">
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
              ) : needsStaff ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setBroadcastingShiftId(s.id)}>
                    <Megaphone className="h-3.5 w-3.5" aria-hidden />
                    Broadcast
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setAssigningShiftId(s.id)}>
                    <UserPlus className="h-3.5 w-3.5" aria-hidden />
                    Assign
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
