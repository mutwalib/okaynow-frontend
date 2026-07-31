import type { Shift, ShiftStatus } from "./types";

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** e.g. "11:00 PM – 3:00 AM (next day)" when the shift crosses midnight. */
export function formatShiftWindow(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  endsNextDay = false,
): string {
  if (!startTime || !endTime) return "—";
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (endsNextDay || crossesMidnight(startTime, endTime)) {
    return `${start} – ${end} (next day)`;
  }
  return `${start} – ${end}`;
}

function crossesMidnight(startTime: string, endTime: string): boolean {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return eh + em / 60 <= sh + sm / 60;
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Local calendar ISO date (YYYY-MM-DD). */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Default stats window: 7 days ago → today. */
export function defaultStatsDateRange(): {
  periodStart: string;
  periodEnd: string;
} {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { periodStart: toIsoDate(start), periodEnd: toIsoDate(end) };
}

export function shiftHours(shift: Shift): number {
  const [sh, sm] = shift.startTime.split(":").map(Number);
  const [eh, em] = shift.endTime.split(":").map(Number);
  let hours = eh + em / 60 - (sh + sm / 60);
  if (hours <= 0) hours += 24;
  return hours;
}

export function statusTone(status: ShiftStatus): string {
  switch (status) {
    case "DRAFT":
    case "HELD":
      return "badge-progress";
    case "OPEN":
      return "badge-open";
    case "CLAIMED":
    case "CONFIRMED":
      return "badge-confirmed";
    case "IN_PROGRESS":
      return "badge-progress";
    case "COMPLETED":
      return "badge-done";
    case "CANCELLED":
    case "NO_SHOW":
      return "badge-cancel";
    default:
      return "badge-open";
  }
}
