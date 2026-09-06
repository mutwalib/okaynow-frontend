"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileBarChart2 } from "lucide-react";
import { ExportAgencyReportButtons } from "@/components/export-agency-report-buttons";
import { Field, Input, Select } from "@/components/ui/field";
import { getAgencyConnections, type AgencyReportType } from "@/lib/api";
import { defaultStatsDateRange, toIsoDate } from "@/lib/format";
import {
  QUALIFICATIONS,
  type PaymentStatus,
  type Qualification,
  type ShiftClaimStatus,
  type ShiftStatus,
} from "@/lib/types";

const REPORTS: {
  type: AgencyReportType;
  title: string;
  blurb: string;
}[] = [
  {
    type: "FINANCE",
    title: "Finance & settlements",
    blurb:
      "Completed-shift settlements, client/caregiver payment status, and your agency margin.",
  },
  {
    type: "SHIFTS",
    title: "Shifts",
    blurb:
      "Your agency shift board with status, qualification, client, date, and pay filters.",
  },
  {
    type: "CLAIMS",
    title: "Claims",
    blurb: "Caregiver claims and assignments with claim status filter.",
  },
];

const SHIFT_STATUSES: ShiftStatus[] = [
  "DRAFT",
  "HELD",
  "OPEN",
  "CLAIMED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

const CLAIM_STATUSES: ShiftClaimStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

export default function AgencyReportsPage() {
  const defaults = defaultStatsDateRange();
  const [periodStart, setPeriodStart] = useState(defaults.periodStart);
  const [periodEnd, setPeriodEnd] = useState(defaults.periodEnd);
  const [clientPaymentStatus, setClientPaymentStatus] = useState<
    "" | PaymentStatus
  >("");
  const [caregiverPaymentStatus, setCaregiverPaymentStatus] = useState<
    "" | PaymentStatus
  >("");

  const [shiftStatus, setShiftStatus] = useState<"" | ShiftStatus>("");
  const [qualification, setQualification] = useState<"" | Qualification>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clientRef, setClientRef] = useState("");
  const [minPay, setMinPay] = useState("");
  const [maxPay, setMaxPay] = useState("");
  const [dayPeriod, setDayPeriod] = useState("");

  const [claimStatus, setClaimStatus] = useState<"" | ShiftClaimStatus>("");

  const connections = useQuery({
    queryKey: ["agency-connections"],
    queryFn: getAgencyConnections,
  });

  const ownerFilter = useMemo(() => {
    const [kind, id] = clientRef.split(":");
    if (!id) return {} as { clientProfileId?: string; facilityProfileId?: string };
    if (kind === "FACILITY") return { facilityProfileId: id };
    if (kind === "FAMILY") return { clientProfileId: id };
    return {} as { clientProfileId?: string; facilityProfileId?: string };
  }, [clientRef]);

  const clientOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { ref: string; label: string }[] = [];
    for (const c of connections.data ?? []) {
      if (c.status !== "ACTIVE") continue;
      if (c.facilityProfileId) {
        const ref = `FACILITY:${c.facilityProfileId}`;
        if (seen.has(ref)) continue;
        seen.add(ref);
        const name =
          [c.homeFirstName, c.homeLastName].filter(Boolean).join(" ") ||
          "Facility home";
        options.push({ ref, label: `[Facility] ${name}` });
      } else if (c.clientProfileId) {
        const ref = `FAMILY:${c.clientProfileId}`;
        if (seen.has(ref)) continue;
        seen.add(ref);
        const name =
          [c.homeLastName, c.homeFirstName].filter(Boolean).join(", ") ||
          "Family home";
        options.push({ ref, label: `[Family] ${name}` });
      }
    }
    return options;
  }, [connections.data]);

  const filterMap = useMemo(
    (): Record<AgencyReportType, Record<string, string | undefined>> => ({
      FINANCE: {
        periodStart,
        periodEnd,
        clientPaymentStatus: clientPaymentStatus || undefined,
        caregiverPaymentStatus: caregiverPaymentStatus || undefined,
      },
      SHIFTS: {
        status: shiftStatus || undefined,
        qualification: qualification || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        clientProfileId: ownerFilter.clientProfileId,
        facilityProfileId: ownerFilter.facilityProfileId,
        minPay: minPay || undefined,
        maxPay: maxPay || undefined,
        dayPeriod: dayPeriod || undefined,
      },
      CLAIMS: {
        status: claimStatus || undefined,
      },
    }),
    [
      periodStart,
      periodEnd,
      clientPaymentStatus,
      caregiverPaymentStatus,
      shiftStatus,
      qualification,
      dateFrom,
      dateTo,
      ownerFilter.clientProfileId,
      ownerFilter.facilityProfileId,
      minPay,
      maxPay,
      dayPeriod,
      claimStatus,
    ],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="inline-flex items-center gap-2 font-display text-2xl font-semibold text-ink">
          <FileBarChart2 className="h-5 w-5 text-ink-muted" aria-hidden />
          Reports
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Download Excel or PDF exports for your agency only. Each file includes
          the filters you set below.
        </p>
      </div>

      {REPORTS.map((report) => (
        <section
          key={report.type}
          className="space-y-3 rounded-xl border border-line bg-paper p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                {report.title}
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">{report.blurb}</p>
            </div>
            <ExportAgencyReportButtons
              type={report.type}
              filters={filterMap[report.type]}
            />
          </div>

          {report.type === "FINANCE" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Period from">
                <Input
                  type="date"
                  value={periodStart}
                  max={periodEnd || toIsoDate(new Date())}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </Field>
              <Field label="Period to">
                <Input
                  type="date"
                  value={periodEnd}
                  min={periodStart || undefined}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </Field>
              <Field label="Client payment">
                <Select
                  value={clientPaymentStatus}
                  onChange={(e) =>
                    setClientPaymentStatus(e.target.value as "" | PaymentStatus)
                  }
                >
                  <option value="">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PAID">Paid</option>
                </Select>
              </Field>
              <Field label="Caregiver payment">
                <Select
                  value={caregiverPaymentStatus}
                  onChange={(e) =>
                    setCaregiverPaymentStatus(
                      e.target.value as "" | PaymentStatus,
                    )
                  }
                >
                  <option value="">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="PAID">Paid</option>
                </Select>
              </Field>
            </div>
          ) : null}

          {report.type === "SHIFTS" ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                value={shiftStatus}
                onChange={(e) =>
                  setShiftStatus(e.target.value as "" | ShiftStatus)
                }
              >
                <option value="">All statuses</option>
                {SHIFT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Select
                value={qualification}
                onChange={(e) =>
                  setQualification(e.target.value as "" | Qualification)
                }
              >
                <option value="">All qualifications</option>
                {QUALIFICATIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </Select>
              <Select
                value={clientRef}
                onChange={(e) => setClientRef(e.target.value)}
              >
                <option value="">All connected homes</option>
                {clientOptions.map((opt) => (
                  <option key={opt.ref} value={opt.ref}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <Select
                value={dayPeriod}
                onChange={(e) => setDayPeriod(e.target.value)}
              >
                <option value="">Any time of day</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
                <option value="NIGHT">Night</option>
                <option value="ALL_DAY">All day</option>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="From date"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="To date"
              />
              <Input
                type="number"
                min="0"
                placeholder="Min pay"
                value={minPay}
                onChange={(e) => setMinPay(e.target.value)}
              />
              <Input
                type="number"
                min="0"
                placeholder="Max pay"
                value={maxPay}
                onChange={(e) => setMaxPay(e.target.value)}
              />
            </div>
          ) : null}

          {report.type === "CLAIMS" ? (
            <div className="max-w-xs">
              <Select
                value={claimStatus}
                onChange={(e) =>
                  setClaimStatus(e.target.value as "" | ShiftClaimStatus)
                }
              >
                <option value="">All statuses</option>
                {CLAIM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
