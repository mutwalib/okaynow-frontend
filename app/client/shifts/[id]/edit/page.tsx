"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { getMyClientProfile, getShift, updateShift } from "@/lib/api";
import { canEditShift } from "@/lib/shift-mutability";
import { ShiftForm, type ShiftFormValues } from "@/components/shift-form";
import { ButtonLink } from "@/components/ui/button";
import { useToast } from "@/lib/toast-context";

export default function EditClientShiftPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const profile = useQuery({
    queryKey: ["client-profile"],
    queryFn: getMyClientProfile,
  });
  const shift = useQuery({
    queryKey: ["shift", id],
    queryFn: () => getShift(id),
    enabled: profile.data?.canUpdateShifts === true,
  });

  if (profile.isLoading) return <p className="text-ink-muted">Loading…</p>;
  if (!profile.data?.canUpdateShifts) {
    return <p className="text-danger">You do not have permission to edit shifts.</p>;
  }
  if (shift.isLoading) return <p className="text-ink-muted">Loading shift…</p>;
  if (!shift.data) return <p className="text-danger">Shift not found.</p>;

  const past = shift.data.date < new Date().toISOString().slice(0, 10);
  if (!canEditShift(shift.data)) {
    return (
      <div className="space-y-4">
        <ButtonLink href={`/client/shifts/${id}`} variant="ghost" className="px-0">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Shift details
        </ButtonLink>
        <p className="text-danger">
          {past
            ? "Past shifts are history only and cannot be edited."
            : "Claimed, confirmed, or in-progress shifts cannot be edited."}
        </p>
      </div>
    );
  }

  async function save(values: ShiftFormValues) {
    try {
      await updateShift(id, {
        requiredQualification: values.requiredQualification,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        addressLine: values.addressLine,
        city: values.city,
        state: values.state,
        zip: values.zip,
        notes: values.notes || undefined,
      });
      showToast("Shift updated", "success");
      router.push(`/client/shifts/${id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not update shift", "error");
      throw error;
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ButtonLink href={`/client/shifts/${id}`} variant="ghost" className="px-0">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Shift details
      </ButtonLink>
      <div>
        <h1 className="font-display text-3xl text-ink">Edit shift</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Update this day&apos;s hours, location, or notes. For a daily routine,
          hours and location apply to all future days in the series.
        </p>
      </div>
      <div className="rounded-lg border border-line bg-paper p-5">
        <ShiftForm
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
            addressLine: shift.data.addressLine,
            city: shift.data.city,
            state: shift.data.state as "MA",
            zip: shift.data.zip,
            requiredHeadcount: shift.data.requiredHeadcount ?? 1,
            notes: shift.data.notes || "",
          }}
          onSubmit={save}
        />
      </div>
    </div>
  );
}
