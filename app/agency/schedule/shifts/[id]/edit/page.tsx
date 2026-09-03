"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { getShift, updateShift } from "@/lib/api";
import { canEditShift } from "@/lib/shift-mutability";
import {
  ShiftForm,
  type AgencyShiftFormValues,
} from "@/components/shift-form";
import { ButtonLink } from "@/components/ui/button";
import { useToast } from "@/lib/toast-context";

export default function AgencyEditShiftPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const shift = useQuery({
    queryKey: ["shift", id],
    queryFn: () => getShift(id),
  });

  if (shift.isLoading) return <p className="text-ink-muted">Loading shift…</p>;
  if (!shift.data) return <p className="text-danger">Shift not found.</p>;

  const past = shift.data.date < new Date().toISOString().slice(0, 10);
  if (!canEditShift(shift.data)) {
    return (
      <div className="space-y-4">
        <ButtonLink href="/agency/schedule" variant="ghost" className="px-0">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Home schedules
        </ButtonLink>
        <p className="text-danger">
          {past
            ? "Past shifts are history only and cannot be edited."
            : "Claimed, confirmed, or in-progress shifts cannot be edited."}
        </p>
      </div>
    );
  }

  async function save(values: AgencyShiftFormValues) {
    try {
      await updateShift(id, {
        requiredQualification: values.requiredQualification,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        notes: values.notes || undefined,
        requiredHeadcount: values.requiredHeadcount,
      });
      showToast("Schedule updated", "success");
      router.push("/agency/schedule");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not update schedule",
        "error",
      );
      throw error;
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ButtonLink href="/agency/schedule" variant="ghost" className="px-0">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Home schedules
      </ButtonLink>
      <div>
        <h1 className="font-display text-3xl text-ink">Edit schedule</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Update hours or notes for this shift. Location stays the home&apos;s
          service address.
        </p>
      </div>
      <div className="rounded-lg border border-line bg-paper p-5">
        <ShiftForm
          forAgency
          mode="edit"
          submitLabel="Save changes"
          submitIcon={Save}
          showRosterAssign={false}
          defaultValues={{
            requiredQualification: shift.data.requiredQualification,
            scheduleType: shift.data.scheduleType ?? "ONE_OFF",
            date: shift.data.date,
            startTime: shift.data.startTime,
            endTime: shift.data.endTime,
            requiredHeadcount: shift.data.requiredHeadcount ?? 1,
            notes: shift.data.notes || "",
          }}
          onSubmit={save}
        />
      </div>
    </div>
  );
}
