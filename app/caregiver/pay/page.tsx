"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote } from "lucide-react";
import { getMyPayEntries, getMyPaySummary } from "@/lib/api";
import { formatDate, formatMoney, formatShiftWindow, defaultStatsDateRange } from "@/lib/format";
import { useListPagination } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { ListPagination } from "@/components/ui/list-pagination";
import { useState } from "react";

export default function CaregiverPayPage() {
  const defaults = defaultStatsDateRange();
  const [periodStart, setPeriodStart] = useState(defaults.periodStart);
  const [periodEnd, setPeriodEnd] = useState(defaults.periodEnd);
  const { page, setPage, pageSize, setPageSize } = useListPagination(
    `${periodStart}|${periodEnd}`,
  );

  const summary = useQuery({
    queryKey: ["caregiver-pay-summary", periodStart, periodEnd],
    queryFn: () => getMyPaySummary(periodStart, periodEnd),
  });

  const entries = useQuery({
    queryKey: ["caregiver-pay-entries", periodStart, periodEnd, page, pageSize],
    queryFn: () => getMyPayEntries(periodStart, periodEnd, { page, size: pageSize }),
  });
  const s = summary.data;

  return (
    <div className="space-y-8">
      <section className="animate-rise">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Your pay
        </p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-4xl text-ink">
          <Banknote className="h-8 w-8 text-brand-deep" aria-hidden />
          Earnings
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          What you earned for completed shifts, what’s been paid, and what’s
          still due. Defaults to the last 7 days through today.
        </p>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase text-ink-muted">
            From
          </span>
          <input
            type="date"
            className="mt-1 block rounded border border-line bg-paper px-2.5 py-1.5 text-sm"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-semibold uppercase text-ink-muted">
            To
          </span>
          <input
            type="date"
            className="mt-1 block rounded border border-line bg-paper px-2.5 py-1.5 text-sm"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </label>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const range = defaultStatsDateRange();
            setPeriodStart(range.periodStart);
            setPeriodEnd(range.periodEnd);
          }}
        >
          Last 7 days
        </Button>
      </div>

      {summary.isLoading ? (
        <p className="text-sm text-ink-muted">Loading pay summary…</p>
      ) : summary.isError ? (
        <p className="text-sm text-danger">Could not load pay summary.</p>
      ) : s ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Period", value: `${s.periodStart} → ${s.periodEnd}` },
            { label: "Shifts", value: String(s.shiftCount) },
            {
              label: "Hours",
              value: Number(s.totalHours).toFixed(1),
            },
            {
              label: "Earned",
              value: formatMoney(Number(s.totalEarned)),
            },
            {
              label: "Paid",
              value: formatMoney(Number(s.paid)),
            },
            {
              label: "Due",
              value: formatMoney(Number(s.pending)),
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-lg border border-line bg-paper px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {k.label}
              </p>
              <p className="mt-1 font-display text-2xl text-ink tabular-nums">
                {k.value}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="rounded-lg border border-line bg-paper overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pay period</th>
            </tr>
          </thead>
          <tbody>
            {entries.data?.content.map((row) => {
              const clientName = [row.clientFirstName, row.clientLastName]
                .filter(Boolean)
                .join(" ");
              return (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {formatDate(row.shiftDate)}
                  </td>
                  <td className="px-4 py-3">{clientName || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {formatShiftWindow(
                      row.startTime,
                      row.endTime,
                      row.endsNextDay,
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {Number(row.hours).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatMoney(Number(row.payRate))}/hr
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold">
                    {formatMoney(Number(row.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.paymentStatus === "PAID"
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-amber-700"
                      }
                    >
                      {row.paymentStatus === "PAID" ? "Paid" : "Due"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted whitespace-nowrap">
                    {formatDate(row.payPeriodStart)} →{" "}
                    {formatDate(row.payPeriodEnd)}
                  </td>
                </tr>
              );
            })}
            {!entries.isLoading && (entries.data?.content.length ?? 0) === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-ink-muted"
                >
                  No completed shifts in this period yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
      {entries.data ? (
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalElements={entries.data.totalElements}
          totalPages={entries.data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={entries.isFetching}
        />
      ) : null}
    </div>
  );
}
