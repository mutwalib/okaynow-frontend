/** Domain types aligned with Phase 1 backend API. */

export type UserRole = "CAREGIVER" | "CLIENT" | "FACILITY" | "ADMIN";

export type Qualification = "CNA" | "HHA" | "PCA" | "LPN" | "RN" | "MAP" | "OTHER";

export const QUALIFICATIONS: Qualification[] = [
  "CNA",
  "HHA",
  "PCA",
  "LPN",
  "RN",
  "MAP",
  "OTHER",
];

export const QUALIFICATION_LABELS: Record<Qualification, string> = {
  CNA: "CNA",
  HHA: "HHA",
  PCA: "PCA",
  LPN: "LPN",
  RN: "RN",
  MAP: "MAP certification",
  OTHER: "Other (not specified)",
};

export type ShiftStatus =
  | "DRAFT"
  | "HELD"
  | "OPEN"
  | "CLAIMED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ShiftScheduleType = "ONE_OFF" | "DAILY_ROUTINE";

export const SHIFT_SCHEDULE_TYPE_LABEL: Record<ShiftScheduleType, string> = {
  ONE_OFF: "One-off",
  DAILY_ROUTINE: "Daily routine",
};

export type UserStatus =
  | "PENDING_VERIFICATION"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "SUSPENDED"
  | "DEACTIVATED";

export type MedicaidEligibility =
  | "YES"
  | "NO"
  | "UNSURE"
  | "PREFER_NOT_TO_SAY";

export type CareRecipientRelationship =
  | "SPOUSE_OR_PARTNER"
  | "ADULT_CHILD"
  | "PARENT"
  | "SIBLING"
  | "OTHER_FAMILY"
  | "LEGAL_GUARDIAN_OR_POA"
  | "FRIEND_OR_NEIGHBOR"
  | "PROFESSIONAL_OR_CASE_MANAGER"
  | "OTHER";

export const MEDICAID_ELIGIBILITY_LABEL: Record<MedicaidEligibility, string> = {
  YES: "Yes",
  NO: "No",
  UNSURE: "Unsure",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

export const CARE_RECIPIENT_RELATIONSHIP_LABEL: Record<
  CareRecipientRelationship,
  string
> = {
  SPOUSE_OR_PARTNER: "Spouse / partner",
  ADULT_CHILD: "Adult child",
  PARENT: "Parent",
  SIBLING: "Sibling",
  OTHER_FAMILY: "Other family member",
  LEGAL_GUARDIAN_OR_POA: "Legal guardian / power of attorney",
  FRIEND_OR_NEIGHBOR: "Friend / neighbor",
  PROFESSIONAL_OR_CASE_MANAGER: "Professional caregiver / case manager",
  OTHER: "Other",
};

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface UserResponse {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export function homePathForUser(user: {
  role: UserRole;
  status?: UserStatus | null;
}): string {
  if (
    (user.role === "CAREGIVER" || user.role === "CLIENT") &&
    user.status === "PENDING_REVIEW"
  ) {
    return "/pending-review";
  }
  return ROLE_HOME[user.role];
}

export interface CaregiverProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  qualifications: Qualification[];
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  serviceRadiusMiles: number | null;
  homeAddressLine: string | null;
  homeCity: string | null;
  homeState: string | null;
  homeZip: string | null;
  homeLat: number | null;
  homeLng: number | null;
  profilePhotoUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
}

export interface ClientProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  careNeeds: string | null;
  registeringForSelf: boolean;
  medicaidEligible: MedicaidEligibility | null;
  relationshipToCareRecipient: CareRecipientRelationship | null;
  canViewShifts: boolean;
  canCreateShifts: boolean;
  canUpdateShifts: boolean;
  canDeleteShifts: boolean;
  profilePhotoUrl: string | null;
}

export type ReviewStatus = "PENDING" | "PUBLISHED" | "HIDDEN";

export interface CaregiverReview {
  id: string;
  shiftId: string;
  shiftClaimId: string;
  caregiverProfileId: string;
  caregiverFirstName: string | null;
  caregiverLastName: string | null;
  reviewerUserId: string;
  reviewerLabel: string;
  clientProfileId: string | null;
  facilityProfileId: string | null;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  moderatedAt: string | null;
}

export interface FacilityProfile {
  id: string;
  userId: string;
  email: string;
  phone: string | null;
  facilityName: string;
  contactFirstName: string;
  contactLastName: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
}

export interface Shift {
  id: string;
  clientProfileId: string | null;
  facilityProfileId?: string | null;
  requiredQualification: Qualification;
  date: string;
  startTime: string;
  endTime: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  payRate: number | null;
  billRate?: number | null;
  status: ShiftStatus;
  scheduleType: ShiftScheduleType;
  seriesId: string | null;
  notes: string | null;
  platformPaid: boolean;
  marketplacePosted?: boolean;
  /** Open marketplace claim seats (partial remaining headcount). */
  marketplaceSlots?: number;
  /** Caregivers needed (default 1). */
  requiredHeadcount?: number;
  /** Active PENDING + CONFIRMED claims filling slots. */
  filledSlots?: number;
  /** Extra $/hr when facility escalation surge is active. */
  surgeBonusPay?: number;
  surgeTierApplied?: number;
  createdBy: string;
  createdAt: string;
}

export type ShiftClaimStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export interface AssignedCaregiver {
  claimId: string;
  caregiverProfileId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  qualifications: Qualification[];
  ratingAvg: number | null;
  ratingCount: number;
  profilePhotoUrl: string | null;
  status: "PENDING" | "CONFIRMED" | "COMPLETED";
  source: "MARKETPLACE" | "ASSIGNED" | "INVITE";
}

export interface ScheduleRosterSlot {
  claimId: string;
  caregiverProfileId: string;
  firstName: string;
  lastName: string;
  status: ShiftClaimStatus;
  source: "MARKETPLACE" | "ASSIGNED" | "INVITE";
}

export interface ScheduleShiftCard {
  id: string;
  clientProfileId: string | null;
  clientLabel: string | null;
  requiredQualification: Qualification;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  scheduleType: ShiftScheduleType;
  seriesId: string | null;
  requiredHeadcount: number;
  filledSlots: number;
  openSlots: number;
  marketplacePosted: boolean;
  marketplaceSlots: number;
  needsCoverage: boolean;
  notes: string | null;
  roster: ScheduleRosterSlot[];
}

export interface ScheduleDay {
  date: string;
  shifts: ScheduleShiftCard[];
}

export interface ClientRosterCaregiver {
  assignmentId: string;
  caregiverProfileId: string;
  firstName: string;
  lastName: string;
  qualifications: Qualification[];
  assignmentType: "PRIMARY" | "ROTATIONAL";
}

export interface ShiftClaim {
  id: string;
  caregiverProfileId: string;
  caregiverFirstName: string;
  caregiverLastName: string;
  caregiverEmail: string;
  status: ShiftClaimStatus;
  source?: "MARKETPLACE" | "ASSIGNED" | "INVITE";
  claimedAt: string;
  releasedAt: string | null;
  cancelReason: string | null;
  shift: Shift;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CaregiverPaySummary {
  periodStart: string;
  periodEnd: string;
  shiftCount: number;
  totalHours: number;
  totalEarned: number;
  paid: number;
  pending: number;
}

export interface CaregiverPayEntry {
  id: string;
  shiftId: string;
  shiftDate: string;
  startTime: string | null;
  endTime: string | null;
  endsNextDay: boolean;
  clientFirstName: string | null;
  clientLastName: string | null;
  hours: number;
  payRate: number;
  amount: number;
  paymentStatus: "PENDING" | "PROCESSING" | "PAID";
  payPeriodStart: string;
  payPeriodEnd: string;
  paidAt: string | null;
}

export type ClockMethod = "GPS" | "MANUAL";

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "VOID";

export interface ClientInvoiceLine {
  id: string;
  settlementId: string | null;
  shiftId: string;
  shiftDate: string;
  description: string;
  hours: number;
  billRate: number;
  amount: number;
}

export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  clientProfileId: string | null;
  clientFirstName: string | null;
  clientLastName: string | null;
  facilityProfileId: string | null;
  facilityName: string | null;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  totalAmount: number;
  notes: string | null;
  sentAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  lines: ClientInvoiceLine[];
}

export type NotificationType =
  | "SHIFT_DRAFT_CREATED"
  | "SHIFT_POSTED"
  | "SHIFT_CLAIMED"
  | "SHIFT_ASSIGNED"
  | "SHIFT_INVITED"
  | "SHIFT_INVITE_ACCEPTED"
  | "SHIFT_INVITE_DECLINED"
  | "SHIFT_INVITE_FAILED"
  | "SHIFT_CONFIRMED"
  | "SHIFT_RELEASED"
  | "SHIFT_HELD"
  | "SHIFT_CANCELLED"
  | "SHIFT_STARTED"
  | "SHIFT_COMPLETED"
  | "SHIFT_EXTENDED"
  | "SHIFT_REPLACEMENT_REQUESTED"
  | "CAREGIVER_REJECTED_BY_CLIENT"
  | "SHIFT_NO_SHOW"
  | "PLATFORM_CONVERSION_FEE"
  | "VISIT_CLOCK_IN"
  | "VISIT_CLOCK_OUT"
  | "VISIT_ARRIVAL_CONFIRMED"
  | "INVOICE_SENT"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ShiftBoardUpdate {
  action: string;
  shiftId: string;
  status: ShiftStatus;
  clientProfileId: string | null;
  city?: string | null;
  date?: string | null;
  requiredQualification?: Qualification | null;
  payRate?: number | null;
  marketplaceSlots?: number | null;
  at: string;
}

export interface Visit {
  id: string;
  shiftId: string;
  claimId: string;
  caregiverProfileId: string;
  caregiverFirstName: string | null;
  caregiverLastName: string | null;
  clockInAt: string;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutAt: string | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  method: ClockMethod;
  clientArrivalConfirmed: boolean;
  clientArrivalConfirmedAt: string | null;
  notes: string | null;
}

export const ROLE_HOME: Record<UserRole, string> = {
  CAREGIVER: "/caregiver",
  CLIENT: "/client",
  FACILITY: "/facility",
  ADMIN: "/",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  CAREGIVER: "Caregiver",
  CLIENT: "Client / Family",
  FACILITY: "Facility",
  ADMIN: "Agency Admin",
};
