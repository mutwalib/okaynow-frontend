import type { AppNotification, UserRole } from "@/lib/types";

export function parseNotificationShiftId(payload: string | null): string | null {
  if (!payload) return null;
  try {
    const data = JSON.parse(payload) as { shiftId?: string };
    return typeof data.shiftId === "string" && data.shiftId ? data.shiftId : null;
  } catch {
    return null;
  }
}

function parseNotificationInvoiceId(payload: string | null): string | null {
  if (!payload) return null;
  try {
    const data = JSON.parse(payload) as { invoiceId?: string };
    return typeof data.invoiceId === "string" && data.invoiceId
      ? data.invoiceId
      : null;
  } catch {
    return null;
  }
}

/** Deep-link for an in-app notification, or null when there is nowhere useful to go. */
export function notificationHref(
  notification: AppNotification,
  role: UserRole | null | undefined,
): string | null {
  if (notification.type === "INVOICE_SENT" && role === "CLIENT") {
    return "/client/billing";
  }
  if (notification.type === "INVOICE_SENT" && role === "FACILITY") {
    return "/facility/billing";
  }

  if (role === "AGENCY_ADMIN") {
    if (notification.type === "SHIFT_REQUEST_RECEIVED") {
      return "/agency/shift-requests";
    }
    const shiftId = parseNotificationShiftId(notification.payload);
    if (
      shiftId &&
      (notification.type === "SHIFT_REQUEST_ACCEPTED" ||
        notification.type === "SHIFT_REQUEST_AUTO_ACCEPTED" ||
        notification.type.startsWith("SHIFT_"))
    ) {
      return `/agency/schedule/shifts/${shiftId}`;
    }
    if (notification.type === "SHIFT_REQUEST_ACCEPTED" ||
        notification.type === "SHIFT_REQUEST_AUTO_ACCEPTED") {
      return "/agency/shifts";
    }
  }

  const shiftId = parseNotificationShiftId(notification.payload);
  if (!shiftId) {
    const invoiceId = parseNotificationInvoiceId(notification.payload);
    if (invoiceId && role === "CLIENT") return "/client/billing";
    if (invoiceId && role === "FACILITY") return "/facility/billing";
    if (invoiceId && role === "ADMIN") return "/finance";
    return null;
  }

  switch (role) {
    case "ADMIN":
      return `/shifts/${shiftId}`;
    case "CAREGIVER":
      return `/caregiver/shifts/${shiftId}`;
    case "CLIENT":
      return `/client/shifts/${shiftId}`;
    case "FACILITY":
      return `/facility/shifts/${shiftId}`;
    case "AGENCY_ADMIN":
      return `/agency/schedule/shifts/${shiftId}`;
    default:
      return null;
  }
}
