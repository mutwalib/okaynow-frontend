"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { homePathForUser } from "@/lib/types";

export default function DashboardRedirectPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    router.replace(homePathForUser(user));
  }, [isAuthenticated, isLoading, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
      Taking you to your workspace…
    </div>
  );
}
