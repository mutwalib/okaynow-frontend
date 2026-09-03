"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { createAgencyFacilityShift } from "@/lib/api";
import {
  ShiftForm,
  type AgencyShiftFormValues,
} from "@/components/shift-form";
import { useToast } from "@/lib/toast-context";
import { ButtonLink } from "@/components/ui/button";

function AgencyNewFacilityShiftInner() {
  const { facilityProfileId } = useParams<{ facilityProfileId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const routine = search.get("routine") === "1";
  const prefillDate = search.get("date") || undefined;
  const prefillStart = search.get("startTime") || undefined;
  const prefillEnd = search.get("endTime") || undefined;
  const { showToast } = useToast();

  async function onSubmit(values: AgencyShiftFormValues) {
    try {
      const created = await createAgencyFacilityShift(facilityProfileId, {
        requiredQualification: values.requiredQualification,
        scheduleType: values.scheduleType,
        date: values.scheduleType === "ONE_OFF" ? values.date : undefined,
        startTime: values.startTime,
        endTime: values.endTime,
        notes: values.notes || undefined,
        requiredHeadcount: values.requiredHeadcount,
        assignFromRoster: false,
      });
      const skipped = created.skippedOverlapCount ?? 0;
      showToast(
        created.createdCount > 1 || skipped > 0
          ? `Created ${created.createdCount} daily schedule day${created.createdCount === 1 ? "" : "s"}${
              skipped > 0
                ? ` (skipped ${skipped} overlapping day${skipped === 1 ? "" : "s"})`
                : ""
            }`
          : "Schedule added",
        "success",
      );
      router.push("/agency/schedule");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add schedule", "error");
      throw err;
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ButtonLink href="/agency/schedule" variant="ghost" className="px-0">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Home schedules
      </ButtonLink>
      <div>
        <h1 className="font-display text-3xl text-ink">
          {routine ? "Create daily routine" : "Add schedule"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Posted on the facility&apos;s calendar using their site address.
          Assign your caregivers from the Shifts page after creating.
        </p>
      </div>
      <div className="rounded-lg border border-line bg-paper p-5">
        <ShiftForm
          forAgency
          showRosterAssign={false}
          submitLabel={routine ? "Create routine" : "Add schedule"}
          submitIcon={Plus}
          defaultValues={{
            scheduleType: routine ? "DAILY_ROUTINE" : "ONE_OFF",
            date: prefillDate ?? "",
            startTime: prefillStart ?? "09:00",
            endTime: prefillEnd ?? "17:00",
          }}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

export default function AgencyNewFacilityShiftPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
      <AgencyNewFacilityShiftInner />
    </Suspense>
  );
}
