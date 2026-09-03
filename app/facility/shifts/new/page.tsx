"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { createShift, getMyFacilityProfile } from "@/lib/api";
import { ShiftForm, type ShiftFormValues } from "@/components/shift-form";
import { useToast } from "@/lib/toast-context";
import { ButtonLink } from "@/components/ui/button";

function FacilityNewShiftInner() {
  const router = useRouter();
  const search = useSearchParams();
  const routine = search.get("routine") === "1";
  const prefillDate = search.get("date") || undefined;
  const prefillStart = search.get("startTime") || undefined;
  const prefillEnd = search.get("endTime") || undefined;
  const { showToast } = useToast();
  const facility = useQuery({
    queryKey: ["facility-me"],
    queryFn: getMyFacilityProfile,
  });

  async function onSubmit(values: ShiftFormValues) {
    try {
      const created = await createShift({
        ...values,
        state: values.state || "MA",
        notes: values.notes || undefined,
        date:
          values.scheduleType === "ONE_OFF" ? values.date : undefined,
        endDate: undefined,
        assignFromRoster: undefined,
      });
      const first = created.shifts[0];
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
          ? "/facility/schedule"
          : `/facility/shifts/${first.id}`,
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not post shift",
        "error",
      );
      throw err;
    }
  }

  const profile = facility.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ButtonLink
        href={routine || prefillDate ? "/facility/schedule" : "/facility/shifts"}
        variant="ghost"
        className="px-0"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {routine || prefillDate ? "Schedule" : "Shift board"}
      </ButtonLink>
      <div>
        <h1 className="font-display text-3xl text-ink">
          {routine ? "Set a daily routine" : "Post facility shift"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {routine
            ? "Ongoing every-day coverage (no end date). Open a day on the schedule to send it to connected agencies when you need coverage."
            : "Coverage for your facility only. Your hourly bill rate is set by the agency and shown before you submit."}
        </p>
      </div>
      <div className="rounded-lg border border-line bg-paper p-5">
        {facility.isLoading ? (
          <p className="text-sm text-ink-muted">Loading facility address…</p>
        ) : (
          <ShiftForm
            submitLabel={routine ? "Create daily schedule" : "Create draft shift"}
            submitIcon={Plus}
            showRosterAssign={false}
            defaultValues={{
              ...(profile
                ? {
                    addressLine: profile.addressLine,
                    city: profile.city,
                    state: profile.state || "MA",
                    zip: profile.zip,
                  }
                : {}),
              ...(routine
                ? { scheduleType: "DAILY_ROUTINE" as const, assignFromRoster: false }
                : {}),
              ...(prefillDate ? { date: prefillDate } : {}),
              ...(prefillStart ? { startTime: prefillStart } : {}),
              ...(prefillEnd ? { endTime: prefillEnd } : {}),
            }}
            onSubmit={onSubmit}
          />
        )}
      </div>
    </div>
  );
}

export default function FacilityNewShiftPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
      <FacilityNewShiftInner />
    </Suspense>
  );
}
