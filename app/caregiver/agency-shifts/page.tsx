"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Agency roster openings now live on the unified Open shifts board. */
export default function CaregiverAgencyShiftsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/caregiver/shifts");
  }, [router]);
  return (
    <p className="text-sm text-ink-muted">
      Agency roster openings are listed under Open shifts…
    </p>
  );
}
