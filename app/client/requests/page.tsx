"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getHomeShiftRequests } from "@/lib/api";
import { QUALIFICATION_LABELS } from "@/lib/types";

export default function ClientShiftRequestsPage() {
  const requests = useQuery({
    queryKey: ["home-shift-requests"],
    queryFn: getHomeShiftRequests,
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Care needs</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Shift requests</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Send care needs to agencies you are connected with. They convert accepted
          requests into shifts and assign roster caregivers.
        </p>
        <ButtonLink href="/client/requests/new" className="mt-4">
          <Plus className="h-4 w-4" aria-hidden />
          New request
        </ButtonLink>
      </section>

      <section className="space-y-3">
        {requests.isLoading ? <p className="text-ink-muted">Loading…</p> : null}
        {!requests.isLoading && (requests.data?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-brand/50" aria-hidden />
            <p className="mt-3 font-medium">No requests yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Connect with an agency first, then post a care need.
            </p>
            <ButtonLink href="/client/agencies" className="mt-4" variant="secondary">
              My agencies
            </ButtonLink>
          </div>
        ) : null}
        {requests.data?.map((r) => (
          <article key={r.id} className="rounded-xl border border-border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink">
                  {QUALIFICATION_LABELS[r.requiredQualification]} · {r.startDate}
                  {r.endDate && r.endDate !== r.startDate ? ` – ${r.endDate}` : ""}
                </p>
                <p className="text-sm text-ink-muted">
                  {r.startTime.slice(0, 5)}–{r.endTime.slice(0, 5)}
                  {r.city ? ` · ${r.city}` : ""}
                </p>
                <p className="mt-1 text-xs text-ink-muted">Status: {r.status}</p>
              </div>
              <Link href={`/client/requests/${r.id}`} className="text-sm text-brand hover:underline">
                Details
              </Link>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-ink-muted">
              {r.targetAgencies.map((a) => (
                <li key={a.agencyId}>
                  {a.agencyDisplayName}: {a.status}
                  {a.createdShiftId ? " (shift created)" : ""}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
