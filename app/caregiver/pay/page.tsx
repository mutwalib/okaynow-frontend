"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote } from "lucide-react";
import { getMyPayEntries, getMyPaySummary, getMyRosters } from "@/lib/api";
import {
  formatDate,
  formatMoney,
  formatShiftWindow,
  defaultStatsDateRange,
} from "@/lib/format";
import { useListPagination } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { ListPagination } from "@/components/ui/list-pagination";
import type { CaregiverPayEntry } from "@/lib/types";

const FILTER_ALL = "all";
const FILTER_INDEPENDENT = "independent";

type AgencyFilter = typeof FILTER_ALL | typeof FILTER_INDEPENDENT | string;

function matchesEntryFilter(entry: CaregiverPayEntry, filter: AgencyFilter) {
  if (filter === FILTER_ALL) return true;
  if (filter === FILTER_INDEPENDENT) return !entry.agencyId;
  return entry.agencyId === filter;
}

export default function CaregiverPayPage() {
  const defaults = defaultStatsDateRange();
  const [periodStart, setPeriodStart] = useState(defaults.periodStart);
  const [periodEnd, setPeriodEnd] = useState(defaults.periodEnd);
  const [agencyFilter, setAgencyFilter] = useState<AgencyFilter>(FILTER_ALL);
  const { page, setPage, pageSize, setPageSize } = useListPagination(
    `${periodStart}|${periodEnd}|${agencyFilter}`,
  );

  const summary = useQuery({
    queryKey: ["caregiver-pay-summary", periodStart, periodEnd],
    queryFn: () => getMyPaySummary(periodStart, periodEnd),
  });

  const entries = useQuery({
    queryKey: ["caregiver-pay-entries", periodStart, periodEnd, page, pageSize],
    queryFn: () =>
      getMyPayEntries(periodStart, periodEnd, { page, size: pageSize }),
  });
  const rosters = useQuery({
    queryKey: ["my-rosters"],
    queryFn: getMyRosters,
  });
  const s = summary.data;

  const agencyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rosters.data ?? []) {
      if (r.status === "ACTIVE" || r.status === "SUSPENDED") {
        map.set(r.agencyId, r.agencyDisplayName?.trim() || "Agency");
      }
    }
    for (const slice of s?.byAgency ?? []) {
      if (slice.agencyId) {
        map.set(slice.agencyId, slice.agencyDisplayName?.trim() || "Agency");
      }
    }
    for (const e of entries.data?.content ?? []) {
      if (e.agencyId) {
        map.set(e.agencyId, e.agencyDisplayName?.trim() || "Agency");
      }
    }
    const agencies = Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { agencies, show: agencies.length > 0 };
  }, [rosters.data, s, entries.data]);

  const activeSlice =
    agencyFilter === FILTER_ALL
      ? null
      : (s?.byAgency ?? []).find((slice) =>
          agencyFilter === FILTER_INDEPENDENT
            ? slice.agencyId == null
            : slice.agencyId === agencyFilter,
        );

  const emptySlice = {
    shiftCount: 0,
    totalHours: 0,
    totalEarned: 0,
    paid: 0,
    processing: 0,
    pending: 0,
  };

  const display =
    agencyFilter !== FILTER_ALL
      ? activeSlice
        ? {
            shiftCount: activeSlice.shiftCount,
            totalHours: activeSlice.totalHours,
            totalEarned: activeSlice.totalEarned,
            paid: activeSlice.paid,
            processing: activeSlice.processing,
            pending: activeSlice.pending,
          }
        : emptySlice
      : s
        ? {
            shiftCount: s.shiftCount,
            totalHours: s.totalHours,
            totalEarned: s.totalEarned,
            paid: s.paid,
            processing: s.processing,
            pending: s.pending,
          }
        : null;

  const filteredRows = useMemo(
    () =>
      (entries.data?.content ?? []).filter((row) =>
        matchesEntryFilter(row, agencyFilter),
      ),
    [entries.data, agencyFilter],
  );

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
          Earned shifts, hours, paid, processing, and pending for completed
          visits. Defaults to the last 7 days through today.
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

      {agencyOptions.show ? (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="All"
            active={agencyFilter === FILTER_ALL}
            onClick={() => setAgencyFilter(FILTER_ALL)}
          />
          <FilterChip
            label="Independent"
            active={agencyFilter === FILTER_INDEPENDENT}
            onClick={() => setAgencyFilter(FILTER_INDEPENDENT)}
          />
          {agencyOptions.agencies.map((a) => (
            <FilterChip
              key={a.id}
              label={a.name}
              active={agencyFilter === a.id}
              onClick={() => setAgencyFilter(a.id)}
            />
          ))}
        </div>
      ) : null}

      {summary.isLoading ? (
        <p className="text-sm text-ink-muted">Loading pay summary…</p>
      ) : summary.isError ? (
        <p className="text-sm text-danger">Could not load pay summary.</p>
      ) : display ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Earned shifts", value: String(display.shiftCount) },
            {
              label: "Hours",
              value: Number(display.totalHours).toFixed(1),
            },
            {
              label: "Earned",
              value: formatMoney(Number(display.totalEarned)),
            },
            {
              label: "Paid",
              value: formatMoney(Number(display.paid)),
            },
            {
              label: "Processing",
              value: formatMoney(Number(display.processing ?? 0)),
            },
            {
              label: "Pending",
              value: formatMoney(Number(display.pending)),
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

      {agencyFilter === FILTER_ALL && (s?.byAgency?.length ?? 0) > 1 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl text-ink">By agency</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {s!.byAgency!.map((slice) => (
              <div
                key={slice.agencyId ?? "independent"}
                className="rounded-lg border border-line bg-paper px-4 py-3"
              >
                <p className="font-semibold text-brand">
                  {slice.agencyDisplayName}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {slice.shiftCount} shift{slice.shiftCount === 1 ? "" : "s"} ·{" "}
                  {Number(slice.totalHours).toFixed(1)} hrs · earned{" "}
                  {formatMoney(Number(slice.totalEarned))}
                </p>
                <p className="text-sm text-ink-muted">
                  Paid {formatMoney(Number(slice.paid))} · Processing{" "}
                  {formatMoney(Number(slice.processing ?? 0))} · Pending{" "}
                  {formatMoney(Number(slice.pending))}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Earned shifts</h2>
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Agency</th>
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
              {filteredRows.map((row) => {
                const clientName = [row.clientFirstName, row.clientLastName]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {formatDate(row.shiftDate)}
                    </td>
                    <td className="px-4 py-3 text-brand font-medium">
                      {row.agencyDisplayName?.trim() || "Independent"}
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
                            : row.paymentStatus === "PROCESSING"
                              ? "font-semibold text-sky-700"
                              : "font-semibold text-amber-700"
                        }
                      >
                        {row.paymentStatus === "PAID"
                          ? "Paid"
                          : row.paymentStatus === "PROCESSING"
                            ? "Processing"
                            : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted whitespace-nowrap">
                      {formatDate(row.payPeriodStart)} →{" "}
                      {formatDate(row.payPeriodEnd)}
                    </td>
                  </tr>
                );
              })}
              {!entries.isLoading && filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-ink-muted"
                  >
                    No earned shifts in this period
                    {agencyFilter !== FILTER_ALL ? " for this filter" : ""}.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md border border-brand bg-brand/10 px-3 py-1.5 text-sm font-semibold text-brand-deep"
          : "rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-medium text-ink-muted"
      }
    >
      {label}
    </button>
  );
}
