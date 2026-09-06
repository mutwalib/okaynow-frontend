"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  getAgencyRosterHub,
  markAgencyCaregiverPayment,
} from "@/lib/api";
import { formatDate, formatMoney, toIsoDate } from "@/lib/format";
import { useToast } from "@/lib/toast-context";
import {
  AGENCY_CAREGIVER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  QUALIFICATION_LABELS,
  ROSTER_PAY_CLASSIFICATION_LABEL,
  formatPayOffer,
  formatStatusLabel,
} from "@/lib/types";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);
  to.setDate(to.getDate() + 30);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

export default function AgencyRosterMemberHubPage() {
  const params = useParams<{ id: string }>();
  const rosterId = params.id;
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const initial = useMemo(() => defaultRange(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [applied, setApplied] = useState(initial);

  const hub = useQuery({
    queryKey: ["agency-roster-hub", rosterId, applied.from, applied.to],
    queryFn: () => getAgencyRosterHub(rosterId, applied.from, applied.to),
    enabled: !!rosterId,
  });

  const markPaid = useMutation({
    mutationFn: (settlementId: string) =>
      markAgencyCaregiverPayment(settlementId, "PAID"),
    onSuccess: () => {
      showToast("Marked caregiver as paid", "success");
      void queryClient.invalidateQueries({
        queryKey: ["agency-roster-hub", rosterId],
      });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const member = hub.data?.member;
  const summary = hub.data?.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <ButtonLink
            href="/agency/roster"
            variant="secondary"
            size="sm"
            className="mb-3"
          >
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Roster
          </ButtonLink>
          {member ? (
            <>
              <h1 className="font-display text-3xl text-ink">
                {member.firstName} {member.lastName}
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                {member.email} ·{" "}
                {formatStatusLabel(
                  member.rosterStatus,
                  AGENCY_CAREGIVER_STATUS_LABEL,
                )}
              </p>
              {formatPayOffer(member.agreedPayRate, member.payClassification) ? (
                <p className="mt-2 text-sm text-ink">
                  {formatPayOffer(member.agreedPayRate, member.payClassification)}
                </p>
              ) : null}
              {member.payClassification ? (
                <p className="mt-1 text-xs text-ink-muted">
                  {ROSTER_PAY_CLASSIFICATION_LABEL[member.payClassification]}
                </p>
              ) : null}
            </>
          ) : (
            <h1 className="font-display text-3xl text-ink">Roster member</h1>
          )}
        </div>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ from, to });
          }}
        >
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Button type="submit" variant="secondary" size="sm">
            Apply
          </Button>
        </form>
      </div>

      {hub.isLoading ? <p className="text-ink-muted">Loading schedule and timesheets…</p> : null}
      {hub.isError ? (
        <p className="text-sm text-danger">{(hub.error as Error).message}</p>
      ) : null}

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Upcoming" value={String(summary.upcomingShifts)} />
          <Stat label="In progress" value={String(summary.inProgressShifts)} />
          <Stat label="Completed" value={String(summary.completedShifts)} />
          <Stat
            label="Unfulfilled"
            value={String(summary.unfulfilledShifts)}
            warn={summary.unfulfilledShifts > 0}
          />
          <Stat
            label="Pending pay"
            value={`${summary.pendingPayCount} · ${formatMoney(summary.pendingPayAmount)}`}
            warn={summary.pendingPayCount > 0}
          />
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Schedule</h2>
        <p className="text-sm text-ink-muted">
          Shifts assigned to this caregiver. Unfulfilled means the shift still needs
          coverage.
        </p>
        {(hub.data?.schedule.length ?? 0) === 0 ? (
          <p className="text-sm text-ink-muted">No shifts in this date range.</p>
        ) : null}
        {hub.data?.schedule.map((item) => (
          <article
            key={item.claimId}
            className={`rounded-xl border bg-white p-4 ${
              item.fulfilled ? "border-border" : "border-amber-300 bg-amber-50/40"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">
                  {formatDate(item.date)}
                  {item.startTime && item.endTime
                    ? ` · ${item.startTime.slice(0, 5)}–${item.endTime.slice(0, 5)}`
                    : ""}
                  {item.city ? ` · ${item.city}` : ""}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {QUALIFICATION_LABELS[item.requiredQualification] ??
                    item.requiredQualification}{" "}
                  · Shift {formatStatusLabel(item.shiftStatus)} · Claim{" "}
                  {formatStatusLabel(item.claimStatus)} ·{" "}
                  {item.fulfilled ? (
                    <span className="font-medium text-emerald-800">Fulfilled</span>
                  ) : (
                    <span className="font-medium text-amber-900">
                      Not fulfilled ({item.filledSlots}/{item.requiredHeadcount})
                    </span>
                  )}
                </p>
                {item.callToAction ? (
                  <p className="mt-2 text-sm font-medium text-brand-deep">
                    {item.callToAction}
                  </p>
                ) : null}
              </div>
              <ButtonLink
                href={`/agency/schedule/shifts/${item.shiftId}`}
                size="sm"
                variant="secondary"
              >
                Open shift
              </ButtonLink>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Timesheets &amp; pay</h2>
        <p className="text-sm text-ink-muted">
          Dated settlements for this caregiver. Mark paid after you run payroll outside
          OkayNow.
        </p>
        {(hub.data?.timesheets.length ?? 0) === 0 ? (
          <p className="text-sm text-ink-muted">No timesheets in this date range.</p>
        ) : null}
        {hub.data?.timesheets.map((row) => (
          <article
            key={row.settlementId}
            className="rounded-xl border border-border bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink">
                  {formatDate(row.shiftDate)} · {Number(row.hours).toFixed(2)} hrs ·{" "}
                  {formatMoney(row.caregiverAmount)}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  ${Number(row.payRate).toFixed(2)}/hr · Caregiver pay:{" "}
                  {PAYMENT_STATUS_LABEL[row.caregiverPaymentStatus]} · Client:{" "}
                  {PAYMENT_STATUS_LABEL[row.clientPaymentStatus]}
                  {row.payPeriodStart && row.payPeriodEnd
                    ? ` · Period ${formatDate(row.payPeriodStart)} – ${formatDate(row.payPeriodEnd)}`
                    : ""}
                </p>
                {row.callToAction ? (
                  <p className="mt-2 text-sm font-medium text-brand-deep">
                    {row.callToAction}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink
                  href={`/agency/schedule/shifts/${row.shiftId}`}
                  size="sm"
                  variant="secondary"
                >
                  Open shift
                </ButtonLink>
                {row.caregiverPaymentStatus !== "PAID" ? (
                  <Button
                    size="sm"
                    disabled={markPaid.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Mark this caregiver timesheet as paid? Use this after you pay them in your payroll system.",
                        )
                      ) {
                        markPaid.mutate(row.settlementId);
                      }
                    }}
                  >
                    Mark paid
                  </Button>
                ) : (
                  <span className="self-center text-xs font-semibold text-emerald-800">
                    Paid
                    {row.caregiverPaidAt
                      ? ` · ${new Date(row.caregiverPaidAt).toLocaleDateString()}`
                      : ""}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className="text-sm text-ink-muted">
        Need profile actions (pay offer, suspend, remove)?{" "}
        <Link href="/agency/roster" className="font-medium text-brand-deep underline">
          Back to roster
        </Link>
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        warn ? "border-amber-300 bg-amber-50/50" : "border-border bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-xl text-ink">{value}</p>
    </div>
  );
}
