"use client";

import RegisterFormPage from "@/components/register-form";

/** Pretty alias for /register?role=AGENCY_ADMIN */
export default function AgencyRegisterPage() {
  return <RegisterFormPage lockedRole="AGENCY_ADMIN" />;
}
