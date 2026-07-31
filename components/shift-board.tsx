"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getClientOptions, getShifts } from "@/lib/api";
import { MOCK_SHIFTS } from "@/lib/mockShifts";
import { useListPagination } from "@/lib/pagination";
import type { PagedResponse } from "@/lib/types";
import { QUALIFICATIONS, type Shift, type ShiftStatus } from "@/lib/types";
import { Field, Input, Select } from "./ui/field";
import { ListPagination } from "./ui/list-pagination";
import { EmptyState, LoadingBlock, ShiftCard } from "./shift-card";

export function ShiftBoard({
  basePath,
  showBillRate = false,
  defaultStatus = "OPEN",
  showClientFilter = false,
  allowClaim = false,
}: {
  basePath: string;
  showBillRate?: boolean;
  defaultStatus?: ShiftStatus | "";
  showClientFilter?: boolean;
  allowClaim?: boolean;
}) {
  const [qualification, setQualification] = useState("");
  const [status, setStatus] = useState<string>(defaultStatus);
  const [dateFrom, setDateFrom] = useState("");
  const [minPay, setMinPay] = useState("");
  const [maxPay, setMaxPay] = useState("");
  const [dayPeriod, setDayPeriod] = useState("");
  const [clientProfileId, setClientProfileId] = useState("");
  const [usingMock, setUsingMock] = useState(false);
  const filterKey = [
    qualification,
    status,
    dateFrom,
    minPay,
    maxPay,
    dayPeriod,
    clientProfileId,
  ].join("|");
  const { page, setPage, pageSize, setPageSize } = useListPagination(filterKey);
  const clients = useQuery({
    queryKey: ["client-options"],
    queryFn: getClientOptions,
    enabled: showClientFilter,
  });

  const query = useQuery({
    queryKey: [
      "shifts",
      qualification,
      status,
      dateFrom,
      minPay,
      maxPay,
      dayPeriod,
      clientProfileId,
      page,
      pageSize,
    ],
    queryFn: async (): Promise<PagedResponse<Shift>> => {
      try {
        const result = await getShifts({
          qualification: qualification || undefined,
          status: status || undefined,
          dateFrom: dateFrom || undefined,
          minPay: minPay ? Number(minPay) : undefined,
          maxPay: maxPay ? Number(maxPay) : undefined,
          dayPeriod: dayPeriod || undefined,
          clientProfileId: showClientFilter
            ? clientProfileId || undefined
            : undefined,
          page,
          size: pageSize,
        });
        setUsingMock(false);
        return result;
      } catch {
        setUsingMock(true);
        const filtered = MOCK_SHIFTS.filter((s) => {
          if (!status && s.status === "DRAFT") return false;
          if (qualification && s.requiredQualification !== qualification)
            return false;
          if (status && s.status !== status) return false;
          if (dateFrom && s.date < dateFrom) return false;
          if (clientProfileId && s.clientProfileId !== clientProfileId)
            return false;
          if (
            minPay &&
            Number(showBillRate ? s.billRate : s.payRate) < Number(minPay)
          )
            return false;
          if (
            maxPay &&
            Number(showBillRate ? s.billRate : s.payRate) > Number(maxPay)
          )
            return false;
          if (dayPeriod) {
            const startHour = Number(s.startTime.split(":")[0]);
            const duration = shiftHoursForFilter(s);
            if (dayPeriod === "ALL_DAY" && duration < 12) return false;
            if (dayPeriod === "MORNING" && !(startHour >= 5 && startHour < 12))
              return false;
            if (
              dayPeriod === "AFTERNOON" &&
              !(startHour >= 12 && startHour < 17)
            )
              return false;
            if (dayPeriod === "EVENING" && !(startHour >= 17 && startHour < 21))
              return false;
            if (dayPeriod === "NIGHT" && !(startHour >= 21 || startHour < 5))
              return false;
          }
          return true;
        });
        const start = page * pageSize;
        const content = filtered.slice(start, start + pageSize);
        return {
          content,
          page,
          size: pageSize,
          totalElements: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
          last: start + pageSize >= filtered.length,
        };
      }
    },
  });

  const shifts = useMemo(() => query.data?.content ?? [], [query.data?.content]);

  return (
    <div className="space-y-6">
      {!showClientFilter && defaultStatus === "OPEN" ? (
        <p className="text-sm text-ink-muted">
          Showing free open shifts in your service area. Filled shifts are not permanent —
          when they reopen, eligible caregivers in jurisdiction can claim them again.
        </p>
      ) : null}
      <div className="grid gap-3 rounded-lg border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-4">
        {showClientFilter ? (
          <Field label="Client">
            <Select
              value={clientProfileId}
              onChange={(e) => setClientProfileId(e.target.value)}
            >
              <option value="">All clients</option>
              {clients.data?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.lastName}, {client.firstName}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="Qualification">
          <Select
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
          >
            <option value="">Any</option>
            {QUALIFICATIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any</option>
            <option value="OPEN">Open</option>
            <option value="CLAIMED">Claimed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </Field>
        <Field label="From date">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </Field>
        <Field label="Time of day">
          <Select value={dayPeriod} onChange={(e) => setDayPeriod(e.target.value)}>
            <option value="">Any time</option>
            <option value="MORNING">Morning · 5 AM–noon</option>
            <option value="AFTERNOON">Afternoon · noon–5 PM</option>
            <option value="EVENING">Evening · 5–9 PM</option>
            <option value="NIGHT">Night · 9 PM–5 AM</option>
            <option value="ALL_DAY">All day · 12+ hours</option>
          </Select>
        </Field>
        <Field label={showBillRate ? "Minimum bill" : "Minimum pay"}>
          <Input
            type="number"
            min="0"
            step="1"
            placeholder="$ minimum"
            value={minPay}
            onChange={(e) => setMinPay(e.target.value)}
          />
        </Field>
        <Field label={showBillRate ? "Maximum bill" : "Maximum pay"}>
          <Input
            type="number"
            min="0"
            step="1"
            placeholder="$ maximum"
            value={maxPay}
            onChange={(e) => setMaxPay(e.target.value)}
          />
        </Field>
      </div>

      {usingMock ? (
        <p className="text-xs text-warn">
          Showing sample shifts — start the backend for live data.
        </p>
      ) : null}

      {query.isLoading ? <LoadingBlock /> : null}

      {!query.isLoading && shifts.length === 0 ? (
        <EmptyState
          title="No shifts match"
          body="Try clearing filters or post a new shift from your dashboard."
        />
      ) : null}

      <div className="rounded-lg border border-line bg-paper px-4 sm:px-5">
        {shifts.map((shift: Shift) => (
          <ShiftCard
            key={shift.id}
            shift={shift}
            href={`${basePath}/${shift.id}`}
            showBillRate={showBillRate}
            allowClaim={allowClaim}
          />
        ))}
      </div>

      {query.data ? (
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalElements={query.data.totalElements}
          totalPages={query.data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={query.isFetching}
        />
      ) : null}
    </div>
  );
}

function shiftHoursForFilter(shift: Shift): number {
  const [startHour, startMinute] = shift.startTime.split(":").map(Number);
  const [endHour, endMinute] = shift.endTime.split(":").map(Number);
  let hours = endHour + endMinute / 60 - (startHour + startMinute / 60);
  if (hours <= 0) hours += 24;
  return hours;
}
