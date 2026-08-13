"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";
import { homePathForUser } from "@/lib/types";

export function RoleGuard({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (
      (user.role === "CAREGIVER" || user.role === "CLIENT") &&
      user.status === "PENDING_REVIEW"
    ) {
      router.replace("/pending-review");
      return;
    }
    if (!allow.includes(user.role)) {
      router.replace(homePathForUser(user));
    }
  }, [allow, isAuthenticated, isLoading, router, user]);

  if (
    isLoading ||
    !user ||
    !allow.includes(user.role) ||
    ((user.role === "CAREGIVER" || user.role === "CLIENT") &&
      user.status === "PENDING_REVIEW")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
