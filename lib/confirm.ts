"use client";

/** Ask before a destructive / lifecycle action. Returns true if the user confirms. */
export function confirmAction(message: string): boolean {
  return window.confirm(message);
}

/** Prompt for a reason. Returns trimmed text, or null if cancelled / blank. */
export function promptDeclineReason(
  message = "Reason:",
): string | null {
  const value = window.prompt(message, "");
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
