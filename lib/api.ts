import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearAuthSession,
} from "./auth-cookie";
import type {
  AssignedCaregiver,
  CaregiverProfile,
  CaregiverReview,
  CareRecipientRelationship,
  ClientInvoice,
  ClientProfile,
  FacilityProfile,
  MedicaidEligibility,
  PagedResponse,
  Qualification,
  Shift,
  ShiftClaim,
  ShiftScheduleType,
  ScheduleDay,
  ClientRosterCaregiver,
  UserResponse,
  UserRole,
  UserStatus,
  CaregiverPaySummary,
  CaregiverPayEntry,
  Visit,
  AppNotification,
  AgencyDirectoryEntry,
  AgencyPublicProfile,
  AgencyMe,
  HomeAgencyConnection,
  SubscriptionPlan,
  ShiftRequest,
  AgencyShiftRequestInbox,
  AgencyRosterEntry,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Backend auth payload shape. */
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
}

export interface RegisterPayload {
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  registeringForSelf?: boolean;
  medicaidEligible?: MedicaidEligibility;
  relationshipToCareRecipient?: CareRecipientRelationship;
  facilityName?: string;
  agencyName?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  acceptedLegalDocumentIds?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterResult {
  requiresEmailVerification: boolean;
  email: string;
  message: string;
}

export interface LoginResult {
  requiresOtp: boolean;
  email: string;
  message?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType?: string | null;
  expiresInSeconds?: number | null;
  userId?: string | null;
  role?: UserRole | null;
  status?: UserStatus | null;
}

export interface MessageResponse {
  message: string;
}

export interface CreateShiftPayload {
  clientProfileId?: string;
  requiredQualification: Qualification;
  date?: string;
  endDate?: string;
  scheduleType?: ShiftScheduleType;
  startTime: string;
  endTime: string;
  addressLine: string;
  city: string;
  state?: string;
  zip: string;
  lat?: number;
  lng?: number;
  /** Omitted for clients — agency default pay + take % apply server-side. */
  payRate?: number;
  billRate?: number;
  notes?: string;
  /** Caregivers needed for this shift (default 1). */
  requiredHeadcount?: number;
  /** Fill from client roster (PRIMARY first) when creating. */
  assignFromRoster?: boolean;
}

export interface CreateShiftResponse {
  scheduleType: ShiftScheduleType;
  seriesId: string | null;
  createdCount: number;
  skippedOverlapCount?: number;
  shifts: Shift[];
}

export interface UpdateShiftPayload {
  requiredQualification?: Qualification;
  date?: string;
  startTime?: string;
  endTime?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  payRate?: number;
  billRate?: number;
  notes?: string;
}

export interface ShiftFilters {
  qualification?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  clientProfileId?: string;
  minPay?: number;
  maxPay?: number;
  dayPeriod?: string;
  page?: number;
  size?: number;
}

export interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
}

let refreshPromise: Promise<string | null> | null = null;

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const part = token.split(".")[1];
    if (!part || typeof atob !== "function") return null;
    const padded =
      part.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (part.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function accessTokenExpiresSoon(token: string, skewSeconds = 90): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return payload.exp * 1000 < Date.now() + skewSeconds * 1000;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          clearAuthSession();
          return null;
        }
        const data = (await res.json()) as BackendAuthResponse;
        setAccessToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        return data.accessToken;
      } catch {
        clearAuthSession();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/** Never returns an expired access JWT (avoids STOMP reconnect storms). */
export async function ensureFreshAccessToken(
  options: { force?: boolean } = {},
): Promise<string | null> {
  const current = getAccessToken();
  if (!options.force && current && !accessTokenExpiresSoon(current)) {
    return current;
  }
  const refreshed = await refreshAccessToken();
  if (refreshed && !accessTokenExpiresSoon(refreshed, 0)) {
    return refreshed;
  }
  return null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      `Could not reach API at ${API_BASE_URL}. Is the backend running?`,
      0,
    );
  }

  if (res.status === 401 && retry && !path.startsWith("/api/auth/")) {
    const next = await refreshAccessToken();
    if (next) return request<T>(path, options, false);
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- auth ---

export function registerUser(payload: RegisterPayload) {
  return request<RegisterResult>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: LoginPayload) {
  return request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyEmail(email: string, code: string) {
  return request<BackendAuthResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function resendVerification(email: string) {
  return request<MessageResponse>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function forgotPassword(email: string) {
  return request<MessageResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(email: string, code: string, newPassword: string) {
  return request<MessageResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return request<MessageResponse>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function getMe() {
  return request<UserResponse>("/api/users/me");
}

/** Soft-deletes the signed-in account. Caller should clear the local session. */
export function deleteMyAccount() {
  return request<void>("/api/users/me", { method: "DELETE" });
}

export type OnboardingFieldType = "TEXT" | "FILE" | "PROFILE_PHOTO";
export type OnboardingRequestStatus =
  | "OPEN"
  | "SUBMITTED"
  | "ACCEPTED"
  | "CANCELLED";

export interface OnboardingRequestItem {
  id: string;
  title: string;
  instructions: string | null;
  fieldType: OnboardingFieldType;
  status: OnboardingRequestStatus;
  responseText: string | null;
  fileUrl: string | null;
  createdAt: string;
  submittedAt: string | null;
}

export interface OnboardingStatus {
  userStatus: UserStatus;
  pendingReview: boolean;
  applicationReady: boolean;
  applicationSubmitted: boolean;
  applicationComplete: boolean;
  applicationMissing: string[];
  message: string;
  requests: OnboardingRequestItem[];
}

export function getOnboardingStatus() {
  return request<OnboardingStatus>("/api/onboarding/me");
}

export function submitApplication() {
  return request<OnboardingStatus>("/api/onboarding/me/submit", {
    method: "POST",
  });
}

export function submitOnboardingText(requestId: string, responseText: string) {
  return request<OnboardingRequestItem>(
    `/api/onboarding/me/requests/${requestId}/text`,
    {
      method: "POST",
      body: JSON.stringify({ responseText }),
    },
  );
}

export function submitOnboardingFile(requestId: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return request<OnboardingRequestItem>(
    `/api/onboarding/me/requests/${requestId}/file`,
    { method: "POST", body },
  );
}

// --- caregivers ---

export function getMyCaregiverProfile() {
  return request<CaregiverProfile>("/api/caregivers/me");
}

export function updateMyCaregiverProfile(
  payload: Partial<{
    firstName: string;
    lastName: string;
    qualifications: Qualification[];
    otherQualificationDetail?: string | null;
    hourlyRateMin: number | null;
    hourlyRateMax: number | null;
    serviceRadiusMiles: number | null;
    homeAddressLine: string | null;
    homeCity: string | null;
    homeState: string | null;
    homeZip: string | null;
    homeLat: number | null;
    homeLng: number | null;
  }>,
) {
  return request<CaregiverProfile>("/api/caregivers/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function addCaregiverQualifications(
  qualifications: Qualification[],
  otherQualificationDetail?: string | null,
) {
  return request<CaregiverProfile>("/api/caregivers/me/qualifications", {
    method: "POST",
    body: JSON.stringify({ qualifications, otherQualificationDetail }),
  });
}

export function uploadCaregiverPhoto(file: File) {
  const body = new FormData();
  body.append("file", file);
  return request<CaregiverProfile>("/api/caregivers/me/photo", {
    method: "POST",
    body,
  });
}

export function getMyPublishedReviews() {
  return request<CaregiverReview[]>("/api/caregivers/me/reviews");
}

// --- clients ---

export function getMyClientProfile() {
  return request<ClientProfile>("/api/clients/me");
}

export function updateMyClientProfile(
  payload: Partial<{
    firstName: string;
    lastName: string;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    lat: number | null;
    lng: number | null;
    careNeeds: string | null;
  }>,
) {
  return request<ClientProfile>("/api/clients/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function uploadClientPhoto(file: File) {
  const body = new FormData();
  body.append("file", file);
  return request<ClientProfile>("/api/clients/me/photo", {
    method: "POST",
    body,
  });
}

export function createCaregiverReview(payload: {
  shiftId: string;
  rating: number;
  comment?: string;
}) {
  return request<CaregiverReview>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReviewForShift(shiftId: string) {
  return request<CaregiverReview>(`/api/reviews/shift/${shiftId}`);
}

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// --- facilities ---

export function getMyFacilityProfile() {
  return request<FacilityProfile>("/api/facilities/me");
}

export function updateMyFacilityProfile(payload: {
  contactFirstName: string;
  contactLastName: string;
  phone?: string | null;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
}) {
  return request<FacilityProfile>("/api/facilities/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// --- shifts ---

export function getShifts(filters: ShiftFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return request<PagedResponse<Shift>>(`/api/shifts${qs ? `?${qs}` : ""}`);
}

export function getClientOptions() {
  return request<ClientOption[]>("/api/client-options");
}

export function getShift(id: string) {
  return request<Shift>(`/api/shifts/${id}`);
}

export function getAssignedCaregivers(shiftId: string) {
  return request<AssignedCaregiver[]>(
    `/api/shifts/${shiftId}/assigned-caregivers`,
  );
}

export function createShift(payload: CreateShiftPayload) {
  return request<CreateShiftResponse>("/api/shifts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getScheduleCalendar(from: string, to: string) {
  const params = new URLSearchParams({ from, to });
  return request<ScheduleDay[]>(`/api/schedule/calendar?${params}`);
}

export function requestShiftReplacement(
  id: string,
  reason?: string,
  slots?: number,
) {
  return request<Shift>(`/api/shifts/${id}/request-replacement`, {
    method: "POST",
    body: JSON.stringify({
      reason: reason || undefined,
      slots: slots ?? undefined,
    }),
  });
}

export function closeShiftMarketplace(id: string) {
  return request<Shift>(`/api/shifts/${id}/close-marketplace`, {
    method: "POST",
  });
}

export function getMyCaregiverRoster() {
  return request<ClientRosterCaregiver[]>("/api/clients/me/caregivers");
}

export function assignCaregiverFromRoster(
  shiftId: string,
  caregiverProfileId: string,
) {
  return request<ShiftClaim>(`/api/shifts/${shiftId}/assign-from-roster`, {
    method: "POST",
    body: JSON.stringify({ caregiverProfileId }),
  });
}

export function inviteCaregiverToShift(
  shiftId: string,
  caregiverProfileId: string,
) {
  return request<ShiftClaim>(`/api/shifts/${shiftId}/invite`, {
    method: "POST",
    body: JSON.stringify({ caregiverProfileId }),
  });
}

export function acceptShiftInvite(shiftId: string) {
  return request<ShiftClaim>(`/api/shifts/${shiftId}/accept-invite`, {
    method: "POST",
  });
}

export function declineShiftInvite(shiftId: string) {
  return request<ShiftClaim>(`/api/shifts/${shiftId}/decline-invite`, {
    method: "POST",
  });
}

export function getClientRates() {
  return request<{
    billRate: number;
    caregiverRejectionFee: number;
    platformConversionFee: number;
  }>("/api/agency/client-rates");
}

export function markShiftNoShow(shiftId: string, reason?: string) {
  return request<Shift>(`/api/shifts/${shiftId}/no-show`, {
    method: "POST",
    body: JSON.stringify({ reason: reason || undefined }),
  });
}

export function reportPlatformConversion(
  caregiverProfileId: string,
  notes?: string,
) {
  return request<ClientInvoice>("/api/shifts/platform-conversion", {
    method: "POST",
    body: JSON.stringify({ caregiverProfileId, notes: notes || undefined }),
  });
}

export function getReportedConversionCaregiverIds() {
  return request<string[]>("/api/shifts/platform-conversion/reported-caregivers");
}

export function getPlatformConversionCaregivers() {
  return request<
    { caregiverProfileId: string; firstName: string; lastName: string }[]
  >("/api/shifts/platform-conversion/caregivers");
}

export function getCurrentLegalDocuments() {
  return request<
    {
      id: string;
      documentType: string;
      version: number;
      title: string;
      body: string;
      published: boolean;
    }[]
  >("/api/legal/current");
}

export function getLegalAcceptanceStatus() {
  return request<{
    upToDate: boolean;
    pending: {
      id: string;
      documentType: string;
      version: number;
      title: string;
      body: string;
    }[];
  }>("/api/legal/me/status");
}

export function acceptLegalDocuments(documentIds: string[]) {
  return request<{
    upToDate: boolean;
    pending: unknown[];
  }>("/api/legal/me/accept", {
    method: "POST",
    body: JSON.stringify({ documentIds }),
  });
}

export function rejectAssignedCaregiver(
  shiftId: string,
  claimId: string,
  reason?: string,
) {
  return request<{
    claim: ShiftClaim;
    feeCharged: number;
    feeInvoiceId: string | null;
    feeInvoiceNumber: string | null;
  }>(`/api/shifts/${shiftId}/claims/${claimId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason || undefined }),
  });
}

export function updateShift(id: string, payload: UpdateShiftPayload) {
  return request<Shift>(`/api/shifts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteShift(id: string) {
  return request<void>(`/api/shifts/${id}`, { method: "DELETE" });
}

// --- caregiver bookings ---

export function claimShift(id: string) {
  return request<ShiftClaim>(`/api/shifts/${id}/claim`, {
    method: "POST",
  });
}

export function releaseShift(id: string) {
  return request<ShiftClaim>(`/api/shifts/${id}/release`, {
    method: "POST",
  });
}

export function getMyClaims(page = 0, size = 50) {
  return request<PagedResponse<ShiftClaim>>(
    `/api/claims/me?page=${page}&size=${size}`,
  );
}

export function getVisitByShift(shiftId: string) {
  return request<Visit | undefined>(`/api/visits/by-shift/${shiftId}`).then(
    (visit) => visit ?? null,
  );
}

export function clockInToShift(
  shiftId: string,
  payload?: { lat?: number; lng?: number; notes?: string },
) {
  return request<Visit>(`/api/visits/by-shift/${shiftId}/clock-in`, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export function clockOutOfShift(
  shiftId: string,
  payload?: { lat?: number; lng?: number },
) {
  return request<Visit>(`/api/visits/by-shift/${shiftId}/clock-out`, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export function confirmCaregiverArrival(shiftId: string) {
  return request<Visit>(`/api/visits/by-shift/${shiftId}/confirm-arrival`, {
    method: "POST",
  });
}

export function recordClientAttendance(
  shiftId: string,
  payload: { clockInAt: string; clockOutAt?: string; notes?: string },
) {
  return request<Visit>(`/api/visits/by-shift/${shiftId}/client-attendance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyPaySummary(periodStart?: string, periodEnd?: string) {
  const params = new URLSearchParams();
  if (periodStart) params.set("periodStart", periodStart);
  if (periodEnd) params.set("periodEnd", periodEnd);
  const qs = params.toString();
  return request<CaregiverPaySummary>(
    `/api/payroll/me/summary${qs ? `?${qs}` : ""}`,
  );
}

export function getMyPayEntries(
  periodStart?: string,
  periodEnd?: string,
  opts: { page?: number; size?: number } = {},
) {
  const params = new URLSearchParams();
  if (periodStart) params.set("periodStart", periodStart);
  if (periodEnd) params.set("periodEnd", periodEnd);
  params.set("page", String(opts.page ?? 0));
  params.set("size", String(opts.size ?? 10));
  const qs = params.toString();
  return request<PagedResponse<CaregiverPayEntry>>(
    `/api/payroll/me/entries?${qs}`,
  );
}

export function getMyInvoices(page = 0, size = 50) {
  return request<PagedResponse<ClientInvoice>>(
    `/api/clients/me/invoices?page=${page}&size=${size}`,
  );
}

export function getMyFacilityInvoices(page = 0, size = 50) {
  return request<PagedResponse<ClientInvoice>>(
    `/api/facilities/me/invoices?page=${page}&size=${size}`,
  );
}

export async function downloadMyInvoicePdf(
  id: string,
  invoiceNumber?: string,
  retry = true,
): Promise<void> {
  return downloadInvoicePdfAt(
    `/api/clients/me/invoices/${id}/pdf`,
    invoiceNumber,
    retry,
  );
}

export async function downloadMyFacilityInvoicePdf(
  id: string,
  invoiceNumber?: string,
  retry = true,
): Promise<void> {
  return downloadInvoicePdfAt(
    `/api/facilities/me/invoices/${id}/pdf`,
    invoiceNumber,
    retry,
  );
}

async function downloadInvoicePdfAt(
  path: string,
  invoiceNumber?: string,
  retry = true,
): Promise<void> {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch {
    throw new ApiError(
      `Could not reach API at ${API_BASE_URL}. Is the backend running?`,
      0,
    );
  }

  if (res.status === 401 && retry) {
    const next = await refreshAccessToken();
    if (next) {
      return downloadInvoicePdfAt(path, invoiceNumber, false);
    }
  }

  if (!res.ok) {
    let message = `PDF download failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const filename = match?.[1] || `${invoiceNumber || "invoice"}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function getMyNotifications(page = 0, size = 30) {
  return request<PagedResponse<AppNotification>>(
    `/api/notifications/me?page=${page}&size=${size}`,
  );
}

export function getUnreadNotificationCount() {
  return request<{ count: number }>("/api/notifications/me/unread-count");
}

export function markNotificationRead(id: string) {
  return request<AppNotification>(`/api/notifications/${id}/read`, {
    method: "POST",
  });
}

export function markAllNotificationsRead() {
  return request<{ updated: number }>("/api/notifications/me/read-all", {
    method: "POST",
  });
}

// —— Agency directory & multi-tenant (Phase A) ——

export function searchAgencyDirectory(params?: {
  lat?: number;
  lng?: number;
  radius?: number;
  qualification?: Qualification;
}) {
  const q = new URLSearchParams();
  if (params?.lat != null) q.set("lat", String(params.lat));
  if (params?.lng != null) q.set("lng", String(params.lng));
  if (params?.radius != null) q.set("radius", String(params.radius));
  if (params?.qualification) q.set("qualification", params.qualification);
  const qs = q.toString();
  return request<AgencyDirectoryEntry[]>(
    `/api/agencies/directory${qs ? `?${qs}` : ""}`,
  );
}

export function getAgencyPublicProfile(slug: string) {
  return request<AgencyPublicProfile>(`/api/agencies/${slug}/public-profile`);
}

export function getMyAgency() {
  return request<AgencyMe>("/api/agencies/me");
}

export function updateAgencyDirectoryProfile(payload: {
  displayName: string;
  legalName?: string;
  licenseNumber?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  serviceRadiusMiles?: number;
  publicDescription?: string;
  qualificationsSupported?: Qualification[];
  directoryListed?: boolean;
}) {
  return request<AgencyMe>("/api/agencies/me/directory-profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAgencyConnections() {
  return request<HomeAgencyConnection[]>("/api/agencies/me/connections");
}

export function acceptAgencyConnection(connectionId: string) {
  return request<HomeAgencyConnection>(
    `/api/agencies/me/connections/${connectionId}/accept`,
    { method: "POST" },
  );
}

export function endAgencyConnectionAsAgency(connectionId: string) {
  return request<HomeAgencyConnection>(
    `/api/agencies/me/connections/${connectionId}/end`,
    { method: "POST" },
  );
}

export function createAgencyCheckoutSession(plan: SubscriptionPlan) {
  return request<{ checkoutUrl: string | null; message: string | null }>(
    "/api/agencies/me/billing/checkout",
    { method: "POST", body: JSON.stringify({ plan }) },
  );
}

export function getHomeAgencyConnections() {
  return request<HomeAgencyConnection[]>("/api/home/agencies/connected");
}

export function requestHomeAgencyConnection(agencyId: string, message?: string) {
  return request<HomeAgencyConnection>(
    `/api/home/agencies/${agencyId}/connect-request`,
    {
      method: "POST",
      body: JSON.stringify({ message: message ?? null }),
    },
  );
}

export function endHomeAgencyConnection(agencyId: string) {
  return request<void>(`/api/home/agencies/${agencyId}/connection`, {
    method: "DELETE",
  });
}

export function createHomeShiftRequest(payload: {
  requiredQualification: Qualification;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  agencyIds: string[];
}) {
  return request<ShiftRequest>("/api/home/shift-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getHomeShiftRequests() {
  return request<ShiftRequest[]>("/api/home/shift-requests");
}

export function getAgencyShiftRequestInbox() {
  return request<AgencyShiftRequestInbox[]>("/api/agencies/me/shift-requests");
}

export function acceptAgencyShiftRequest(inboxId: string) {
  return request<ShiftRequest>(`/api/agencies/me/shift-requests/${inboxId}/accept`, {
    method: "POST",
  });
}

export function declineAgencyShiftRequest(inboxId: string) {
  return request<AgencyShiftRequestInbox>(
    `/api/agencies/me/shift-requests/${inboxId}/decline`,
    { method: "POST" },
  );
}

export function getAgencyRoster() {
  return request<AgencyRosterEntry[]>("/api/agencies/me/roster");
}

export function inviteAgencyRosterCaregiver(email: string, message?: string) {
  return request<AgencyRosterEntry>("/api/agencies/me/roster/invite", {
    method: "POST",
    body: JSON.stringify({ email, message: message ?? null }),
  });
}

export function suspendAgencyRosterMember(rosterId: string) {
  return request<AgencyRosterEntry>(`/api/agencies/me/roster/${rosterId}/suspend`, {
    method: "POST",
  });
}

export function getAgencyShifts() {
  return request<Shift[]>("/api/agencies/me/shifts");
}

export function assignAgencyShift(shiftId: string, caregiverProfileId: string) {
  return request<ShiftClaim>(`/api/agencies/me/shifts/${shiftId}/assign`, {
    method: "POST",
    body: JSON.stringify({ caregiverProfileId }),
  });
}

export function getCaregiverRosterInvites() {
  return request<AgencyRosterEntry[]>("/api/caregivers/me/roster-invites");
}

export function acceptCaregiverRosterInvite(id: string) {
  return request<AgencyRosterEntry>(`/api/caregivers/me/roster-invites/${id}/accept`, {
    method: "POST",
  });
}
