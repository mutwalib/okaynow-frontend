"use client";

/** Shared notice: OkayNow is software; agencies/homes verify caregivers themselves. */
export function CaregiverVerificationDisclaimer({
  audience = "agency",
}: {
  audience?: "agency" | "home" | "facility";
}) {
  const who =
    audience === "home"
      ? "Families and homes"
      : audience === "facility"
        ? "Facilities"
        : "Agencies";
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <span className="font-medium">{who} are responsible</span> for verifying
      caregiver identity, qualifications, licenses, and background checks before
      assigning or accepting care. OkayNow provides the platform and does not
      thoroughly verify caregiver particulars.
    </p>
  );
}
