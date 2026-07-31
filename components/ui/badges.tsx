import type { ShiftStatus } from "@/lib/types";
import { statusTone } from "@/lib/format";

export function StatusBadge({ status }: { status: ShiftStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold tracking-wide ${statusTone(status)}`}
    >
      {status.replace("_", " ")}
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
