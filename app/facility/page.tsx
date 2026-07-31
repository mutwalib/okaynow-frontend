"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { getShifts } from "@/lib/api";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingBlock, ShiftCard } from "@/components/shift-card";

export default function FacilityHomePage() {
  const open = useQuery({
    queryKey: ["facility-open"],
    queryFn: async () => (await getShifts({ status: "OPEN", size: 8 })).content,
    retry: false,
  });

  return (
    <div className="space-y-10">
      <section className="animate-rise">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Facility workspace
        </p>
        <h1 className="mt-1 font-display text-4xl text-ink">
          Staff your adult day & residential shifts
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Post open coverage for your facility only. Family/private-home clients
          are managed by the agency — they never appear in this workspace.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/facility/shifts/new" size="lg">
            <PlusCircle className="h-5 w-5" aria-hidden />
            Post a shift
          </ButtonLink>
          <ButtonLink href="/facility/schedule" variant="secondary" size="lg">
            View schedule
          </ButtonLink>
          <ButtonLink href="/facility/shifts" variant="secondary" size="lg">
            View board
          </ButtonLink>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl text-ink">Still open</h2>
        {open.isLoading ? <LoadingBlock /> : null}
        {!open.isLoading && (open.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No open facility shifts"
            body="Post coverage needs so caregivers can claim them."
            action={
              <ButtonLink href="/facility/shifts/new">
                <PlusCircle className="h-4 w-4" aria-hidden />
                Post a shift
              </ButtonLink>
            }
          />
        ) : (
          <div className="rounded-lg border border-line bg-paper px-4 sm:px-5">
            {open.data?.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                href={`/facility/shifts/${shift.id}`}
                showBillRate
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
