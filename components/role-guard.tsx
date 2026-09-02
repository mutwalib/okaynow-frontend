"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";
import { homePathForUser } from "@/lib/types";

/** Routes a pending-review caregiver may still open for existing commitments. */
export function isCaregiverCommitmentPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/caregiver/my-shifts" || pathname.startsWith("/caregiver/my-shifts/")) {
    return true;
  }
  // Shift detail / clock UI: /caregiver/shifts/<id> — not the open board list.
  return /^\/caregiver\/shifts\/[^/]+/.test(pathname);
}

export function RoleGuard({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const pendingCaregiverOnCommitment =
    user?.role === "CAREGIVER" &&
    user.status === "PENDING_REVIEW" &&
    isCaregiverCommitmentPath(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (
      (user.role === "CAREGIVER" || user.role === "CLIENT") &&
      user.status === "PENDING_REVIEW" &&
      !(user.role === "CAREGIVER" && isCaregiverCommitmentPath(pathname))
    ) {
      router.replace("/pending-review");
      return;
    }
    if (!allow.includes(user.role)) {
      router.replace(homePathForUser(user));
    }
  }, [allow, isAuthenticated, isLoading, pathname, router, user]);

  if (
    isLoading ||
    !user ||
    !allow.includes(user.role) ||
    ((user.role === "CAREGIVER" || user.role === "CLIENT") &&
      user.status === "PENDING_REVIEW" &&
      !pendingCaregiverOnCommitment)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
