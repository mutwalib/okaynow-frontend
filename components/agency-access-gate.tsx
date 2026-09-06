"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { getMyAgency } from "@/lib/api";
import type { LucideIcon } from "lucide-react";

const STATUS_PATHS = new Set([
  "/agency/pending-approval",
  "/agency/access-restricted",
]);

export function AgencyAccessGate({
  nav,
  children,
}: {
  nav: { href: string; label: string; icon: LucideIcon }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const agency = useQuery({
    queryKey: ["agency-me"],
    queryFn: getMyAgency,
    refetchInterval: (query) => {
      const status = query.state.data?.accessStatus;
      return status === "PENDING_APPROVAL" ? 20_000 : false;
    },
  });

  const onStatusPage = STATUS_PATHS.has(pathname);
  const accessStatus = agency.data?.accessStatus;
  const allowsConsole = agency.data?.accessAllowsConsole === true;

  useEffect(() => {
    if (agency.isLoading || !agency.data) return;
    if (allowsConsole) {
      if (onStatusPage) router.replace("/agency");
      return;
    }
    if (accessStatus === "PENDING_APPROVAL") {
      if (pathname !== "/agency/pending-approval") {
        router.replace("/agency/pending-approval");
      }
      return;
    }
    if (pathname !== "/agency/access-restricted") {
      router.replace("/agency/access-restricted");
    }
  }, [
    accessStatus,
    agency.data,
    agency.isLoading,
    allowsConsole,
    onStatusPage,
    pathname,
    router,
  ]);

  if (agency.isLoading || !agency.data) {
    return (
      <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
        Loading…
      </div>
    );
  }

  if (!allowsConsole) {
    if (
      (accessStatus === "PENDING_APPROVAL" &&
        pathname === "/agency/pending-approval") ||
      ((accessStatus === "SUSPENDED" || accessStatus === "BLOCKED") &&
        pathname === "/agency/access-restricted")
    ) {
      return <>{children}</>;
    }
    return (
      <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
        Loading…
      </div>
    );
  }

  if (onStatusPage) {
    return (
      <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <AppShell role="AGENCY_ADMIN" nav={nav}>
      {children}
    </AppShell>
  );
}
