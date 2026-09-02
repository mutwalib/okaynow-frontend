"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getHomeShiftRequest } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import { QUALIFICATION_LABELS } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";

const REQUEST_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
};

const AGENCY_STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting response",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
};

export default function ClientShiftRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const request = useQuery({
    queryKey: ["home-shift-request", id],
    queryFn: () => getHomeShiftRequest(id),
    enabled: !!id,
  });

  if (request.isLoading) {
    return <p className="text-ink-muted">Loading…</p>;
  }

  if (request.isError || !request.data) {
    return (
      <div className="space-y-4">
        <Link href="/client/requests" className="inline-flex items-center gap-1 text-sm text-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to requests
        </Link>
        <p className="text-ink-muted">Request not found.</p>
      </div>
    );
  }

  const r = request.data;
  const address = [r.addressLine, r.city, r.state, r.zip].filter(Boolean).join(", ");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/client/requests" className="inline-flex items-center gap-1 text-sm text-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to requests
        </Link>
        <p className="mt-4 text-sm font-medium uppercase tracking-wide text-brand">Care need</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-ink">
            {QUALIFICATION_LABELS[r.requiredQualification]}
          </h1>
          <span className="inline-flex items-center rounded bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {REQUEST_STATUS_LABEL[r.status] ?? r.status}
          </span>
        </div>
        <p className="mt-2 text-ink-muted">
          Posted {formatDate(r.createdAt)}
        </p>
      </div>

      <section className="rounded-xl border border-border bg-white p-5 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Schedule</p>
          <p className="mt-1 font-medium">
            {formatDate(r.startDate)}
            {r.endDate && r.endDate !== r.startDate ? ` – ${formatDate(r.endDate)}` : ""}
          </p>
          <p className="text-sm text-ink-muted">
            {formatTime(r.startTime)} – {formatTime(r.endTime)}
          </p>
        </div>
        {address ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Location</p>
            <p className="mt-1">{address}</p>
          </div>
        ) : null}
        {r.notes ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{r.notes}</p>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Agencies notified</h2>
        {r.targetAgencies.length === 0 ? (
          <p className="text-sm text-ink-muted">No agencies were selected.</p>
        ) : (
          r.targetAgencies.map((a) => (
            <article
              key={a.agencyId}
              className="rounded-xl border border-border bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{a.agencyDisplayName}</p>
                  <p className="text-sm text-ink-muted">
                    {AGENCY_STATUS_LABEL[a.status] ?? a.status}
                  </p>
                </div>
                {a.createdShiftId ? (
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                    Shift created
                  </span>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      <ButtonLink href="/client/requests/new" variant="secondary">
        Post another request
      </ButtonLink>
    </div>
  );
}
