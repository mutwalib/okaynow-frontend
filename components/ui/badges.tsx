import type { ShiftStatus } from "@/lib/types";
import { formatStatusLabel } from "@/lib/types";
import { statusTone } from "@/lib/format";

const SHIFT_STATUS_LABEL: Partial<Record<string, string>> = {
  EXPIRED: "Passed",
  OPEN: "Open",
  DRAFT: "Draft",
  CLAIMED: "Claimed",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

export function StatusBadge({ status }: { status: ShiftStatus | string }) {
  const label = formatStatusLabel(status, SHIFT_STATUS_LABEL);
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold tracking-wide ${statusTone(status as ShiftStatus)}`}
    >
      {label}
    </span>
  );
}

export function PayRateBadge({ payRate }: { payRate: number | null | undefined }) {
  const value = Number(payRate ?? 0);
  return (
    <span className="inline-flex items-baseline gap-0.5 font-display text-lg text-brand-deep">
      ${value.toFixed(0)}
      <span className="text-xs font-sans font-medium text-ink-muted">/hr</span>
    </span>
  );
}
