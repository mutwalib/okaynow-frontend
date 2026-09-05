"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Megaphone,
  Pencil,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import {
  assignAgencyShift,
  broadcastAgencyShift,
  deleteShift,
  getAgencyRoster,
  getAssignedCaregivers,
  getShift,
  unassignAgencyShift,
} from "@/lib/api";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { canDeleteShift, canEditShift } from "@/lib/shift-mutability";
import { isPastShiftClockInWindow } from "@/lib/shift-window";
import { confirmAction } from "@/lib/confirm";
import { AddressLink } from "@/components/address-link";
import { AssignedCaregiversPanel } from "@/components/assigned-caregivers-panel";
import { StatusBadge } from "@/components/ui/badges";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { useToast } from "@/lib/toast-context";

export default function AgencyScheduleShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [assignOpen, setAssignOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [caregiverId, setCaregiverId] = useState("");
  const [inviteIds, setInviteIds] = useState<string[]>([]);

  const query = useQuery({
    queryKey: ["shift", id],
    queryFn: () => getShift(id),
  });
  const roster = useQuery({
    queryKey: ["agency-roster"],
    queryFn: getAgencyRoster,
  });
  const assignments = useQuery({
    queryKey: ["assigned-caregivers", id],
    queryFn: () => getAssignedCaregivers(id),
    enabled: !!id,
  });

  const activeRoster = useMemo(
    () => (roster.data ?? []).filter((r) => r.status === "ACTIVE"),
    [roster.data],
  );

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["shift", id] });
    void qc.invalidateQueries({ queryKey: ["assigned-caregivers", id] });
    void qc.invalidateQueries({ queryKey: ["schedule-calendar"] });
    void qc.invalidateQueries({ queryKey: ["agency-shifts"] });
  };

  const remove = useMutation({
    mutationFn: () => deleteShift(id),
    onSuccess: () => {
      invalidate();
      showToast("Shift removed from schedule", "success");
      router.push("/agency/schedule");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const assign = useMutation({
    mutationFn: (caregiverProfileId: string) =>
      assignAgencyShift(id, caregiverProfileId),
    onSuccess: () => {
      setAssignOpen(false);
      setCaregiverId("");
      invalidate();
      showToast("Caregiver assigned", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const unassign = useMutation({
    mutationFn: (caregiverProfileId: string) =>
      unassignAgencyShift(id, caregiverProfileId),
    onSuccess: () => {
      invalidate();
      showToast("Caregiver unassigned", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  const broadcast = useMutation({
    mutationFn: (caregiverProfileIds?: string[]) =>
      broadcastAgencyShift(id, caregiverProfileIds),
    onSuccess: () => {
      setBroadcastOpen(false);
      setInviteIds([]);
      invalidate();
      showToast("Opened to roster", "success");
    },
    onError: (error: Error) => showToast(error.message, "error"),
  });

  if (query.isLoading) return <p className="text-ink-muted">Loading…</p>;
  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <ButtonLink href="/agency/schedule" variant="ghost" className="px-0">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Home schedules
        </ButtonLink>
        <p className="text-danger">Shift not found.</p>
      </div>
    );
  }

  const s = query.data;
  const needed = s.requiredHeadcount ?? 1;
  const filled = s.filledSlots ?? 0;
  const missing = Math.max(0, needed - filled);
  const allowEdit = canEditShift(s) && !!s.agencyId;
  const allowDelete = canDeleteShift(s) && !!s.agencyId;
  const canStaff =
    !!s.agencyId &&
    !isPastShiftClockInWindow(s) &&
    !["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED", "IN_PROGRESS"].includes(
      s.status,
    ) &&
    missing > 0;
  const canUnassign =
    !!s.agencyId &&
    !["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED", "IN_PROGRESS"].includes(
      s.status,
    );

  function toggleInvite(profileId: string) {
    setInviteIds((prev) =>
      prev.includes(profileId)
        ? prev.filter((x) => x !== profileId)
        : [...prev, profileId],
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-rise">
      <ButtonLink href="/agency/schedule" variant="ghost" className="px-0">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Home schedules
      </ButtonLink>

      <StatusBadge status={s.status} />
      <h1 className="font-display text-4xl text-ink">
        {s.requiredQualification} · {formatDate(s.date)}
      </h1>
      <p className="text-ink-muted">
        {formatTime(s.startTime)} – {formatTime(s.endTime)}
      </p>
      <p className="text-sm text-ink">
        {filled}/{needed} caregivers
        {missing > 0 ? ` · ${missing} open` : " · filled"}
      </p>
      <AddressLink address={s} className="text-ink-muted" />
      {(s.payRate != null || s.billRate != null) && (
        <p className="text-sm text-ink">
          {s.payRate != null ? `Pay ${formatMoney(s.payRate)}/hr` : null}
          {s.payRate != null && s.billRate != null ? " · " : null}
          {s.billRate != null ? `Bill ${formatMoney(s.billRate)}/hr` : null}
        </p>
      )}
      {s.notes ? (
        <p className="whitespace-pre-wrap text-sm text-ink-muted">{s.notes}</p>
      ) : null}

      <AssignedCaregiversPanel shiftId={s.id} canReject={false} />

      {canUnassign && (assignments.data ?? []).length > 0 ? (
        <div className="space-y-2 rounded-lg border border-line bg-paper p-4">
          <p className="text-sm font-medium text-ink">Roster actions</p>
          <ul className="space-y-2">
            {(assignments.data ?? [])
              .filter((a) => a.status === "PENDING" || a.status === "CONFIRMED")
              .map((a) => (
                <li
                  key={a.claimId}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <span>
                    {a.firstName} {a.lastName}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={unassign.isPending}
                    onClick={() => {
                      if (
                        !confirmAction(
                          `Unassign ${a.firstName} ${a.lastName} from this shift?`,
                        )
                      ) {
                        return;
                      }
                      unassign.mutate(a.caregiverProfileId);
                    }}
                  >
                    <UserMinus className="h-3.5 w-3.5" aria-hidden />
                    Unassign
                  </Button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      {canStaff ? (
        <div className="space-y-3 rounded-lg border border-line bg-paper p-4">
          <p className="text-sm font-medium text-ink">Staff this shift</p>
          <p className="text-sm text-ink-muted">
            Assign someone from your roster or open it for roster caregivers in
            the area.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setAssignOpen(true);
                setBroadcastOpen(false);
              }}
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Assign from roster
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setBroadcastOpen(true);
                setAssignOpen(false);
              }}
            >
              <Megaphone className="h-4 w-4" aria-hidden />
              Open to roster
            </Button>
          </div>

          {assignOpen ? (
            <div className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
              <div className="min-w-[200px]">
                <Field label="Caregiver">
                  <Select
                    value={caregiverId}
                    onChange={(e) => setCaregiverId(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {activeRoster.map((r) => (
                      <option key={r.id} value={r.caregiverProfileId}>
                        {r.caregiverFirstName} {r.caregiverLastName}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Button
                size="sm"
                disabled={!caregiverId || assign.isPending}
                onClick={() => assign.mutate(caregiverId)}
              >
                Confirm assign
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAssignOpen(false)}
              >
                Cancel
              </Button>
            </div>
          ) : null}

          {broadcastOpen ? (
            <div className="space-y-3 border-t border-line pt-3">
              <Button
                size="sm"
                variant="secondary"
                disabled={broadcast.isPending}
                onClick={() => broadcast.mutate(undefined)}
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
                  onClick={() => broadcast.mutate(inviteIds)}
                >
                  Send invites ({inviteIds.length})
                </Button>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setBroadcastOpen(false);
                  setInviteIds([]);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {allowEdit || allowDelete ? (
        <div className="flex flex-wrap gap-3 border-t border-line pt-5">
          {allowEdit ? (
            <ButtonLink
              href={`/agency/schedule/shifts/${id}/edit`}
              variant="secondary"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit shift
            </ButtonLink>
          ) : null}
          {allowDelete ? (
            <Button
              variant="secondary"
              disabled={remove.isPending}
              onClick={() => {
                if (
                  !confirmAction(
                    "Remove this shift from the home schedule? This cannot be undone.",
                  )
                ) {
                  return;
                }
                remove.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
