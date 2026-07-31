/** Shift end as local Date; overnight when endTime <= startTime. */
export function shiftEndDateTime(shift: {
  date: string;
  startTime: string;
  endTime: string;
}): Date {
  const [eh, em] = shift.endTime.split(":").map(Number);
  const [sh, sm] = shift.startTime.split(":").map(Number);
  const end = new Date(`${shift.date}T00:00:00`);
  const overnight = eh + em / 60 <= sh + sm / 60;
  if (overnight) end.setDate(end.getDate() + 1);
  end.setHours(eh, em || 0, 0, 0);
  return end;
}

export function shiftStartDateTime(shift: {
  date: string;
  startTime: string;
}): Date {
  const [sh, sm] = shift.startTime.split(":").map(Number);
  const start = new Date(`${shift.date}T00:00:00`);
  start.setHours(sh, sm || 0, 0, 0);
  return start;
}

/** Matches backend ShiftWindows.EARLY_CLOCK_IN_MINUTES. */
export const EARLY_CLOCK_IN_MINUTES = 30;

/** Earliest moment the caregiver may self clock-in. */
export function earliestClockInDateTime(shift: {
  date: string;
  startTime: string;
}): Date {
  const start = shiftStartDateTime(shift);
  return new Date(start.getTime() - EARLY_CLOCK_IN_MINUTES * 60_000);
}

/** True when it is still too early to clock in. */
export function isBeforeShiftClockInWindow(shift: {
  date: string;
  startTime: string;
}): boolean {
  return Date.now() < earliestClockInDateTime(shift).getTime();
}

/** True when the self clock-in window has closed (after shift end). */
export function isPastShiftClockInWindow(shift: {
  date: string;
  startTime: string;
  endTime: string;
}): boolean {
  return Date.now() > shiftEndDateTime(shift).getTime();
}

/** True when self clock-in is currently allowed. */
export function isWithinShiftClockInWindow(shift: {
  date: string;
  startTime: string;
  endTime: string;
}): boolean {
  return !isBeforeShiftClockInWindow(shift) && !isPastShiftClockInWindow(shift);
}
