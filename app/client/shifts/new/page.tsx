"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import {
  assignCaregiverFromRoster,
  createShift,
  getMyClientProfile,
} from "@/lib/api";
import { ShiftForm, type ShiftFormValues } from "@/components/shift-form";
import { useToast } from "@/lib/toast-context";
import { ButtonLink } from "@/components/ui/button";

function ClientNewShiftInner() {
  const router = useRouter();
  const search = useSearchParams();
  const routine = search.get("routine") === "1";
  const prefillDate = search.get("date") || undefined;
  const prefillStart = search.get("startTime") || undefined;
  const prefillEnd = search.get("endTime") || undefined;
  const prefillCaregiverId = search.get("caregiverId") || undefined;
  const { showToast } = useToast();
  const profile = useQuery({
    queryKey: ["client-profile"],
    queryFn: getMyClientProfile,
  });

  if (profile.isLoading) return <p className="text-ink-muted">Loading…</p>;
  if (!profile.data?.canCreateShifts) {
    return <p className="text-danger">You do not have permission to create shifts.</p>;
  }

  const p = profile.data;

  async function onSubmit(values: ShiftFormValues) {
    try {
      const created = await createShift({
        ...values,
        state: values.state || "MA",
        notes: values.notes || undefined,
        date:
          values.scheduleType === "ONE_OFF" ? values.date : undefined,
        endDate: undefined,
        assignFromRoster:
          values.scheduleType === "DAILY_ROUTINE"
            ? values.assignFromRoster !== false
            : undefined,
      });
      const first = created.shifts[0];
      if (prefillCaregiverId && values.scheduleType === "ONE_OFF") {
        try {
          await assignCaregiverFromRoster(first.id, prefillCaregiverId);
        } catch {
          /* shift created; assignment can be done from schedule */
        }
      }
      const skipped = created.skippedOverlapCount ?? 0;
      showToast(
        created.createdCount > 1 || skipped > 0
          ? `Created ${created.createdCount} daily schedule day${created.createdCount === 1 ? "" : "s"}${
              skipped > 0
                ? ` (skipped ${skipped} overlapping day${skipped === 1 ? "" : "s"})`
                : ""
            }`
          : "Draft shift created",
        "success",
      );
      router.push(
        values.scheduleType === "DAILY_ROUTINE" || prefillDate
          ? "/client/schedule"
          : `/client/shifts/${first.id}`,
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not post shift", "error");
      throw err;
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ButtonLink
        href={routine || prefillDate ? "/client/schedule" : "/client/shifts"}
        variant="ghost"
        className="px-0"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {routine || prefillDate ? "Schedule" : "My shifts"}
      </ButtonLink>
      <div>
        <h1 className="font-display text-3xl text-ink">
          {routine
            ? "Set a daily routine"
            : prefillDate
              ? "Create shift"
              : "Post a shift"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {routine
            ? "Set ongoing every-day coverage (no end date). Days fill from your roster; if someone calls out, open that day on the schedule to post it to the marketplace."
            : "Your hourly bill rate is set by the agency and shown before you submit."}
        </p>
      </div>
      <div className="rounded-lg border border-line bg-paper p-5">
        <ShiftForm
          onSubmit={onSubmit}
          submitIcon={Plus}
          submitLabel={routine ? "Create daily schedule" : "Post shift"}
          defaultValues={{
            ...(p.addressLine
              ? {
                  addressLine: p.addressLine,
                  city: p.city || "",
                  state: (p.state as "MA") || "MA",
                  zip: p.zip || "",
                }
              : {}),
            ...(routine
              ? { scheduleType: "DAILY_ROUTINE" as const, assignFromRoster: true }
              : {}),
            ...(prefillDate ? { date: prefillDate } : {}),
            ...(prefillStart ? { startTime: prefillStart } : {}),
            ...(prefillEnd ? { endTime: prefillEnd } : {}),
          }}
        />
      </div>
    </div>
  );
}

export default function ClientNewShiftPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
      <ClientNewShiftInner />
    </Suspense>
  );
}
