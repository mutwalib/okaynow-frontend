"use client";

import { useQuery } from "@tanstack/react-query";
import { Ban, LogOut, PauseCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { getMyAgency } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AGENCY_ACCESS_STATUS_LABEL } from "@/lib/types";

export default function AgencyAccessRestrictedPage() {
  const { logout } = useAuth();
  const agency = useQuery({
    queryKey: ["agency-me"],
    queryFn: getMyAgency,
  });

  const status = agency.data?.accessStatus;
  const blocked = status === "BLOCKED";
  const title = blocked ? "Agency access blocked" : "Agency access suspended";
  const Icon = blocked ? Ban : PauseCircle;
  const name = agency.data?.displayName ?? "Your agency";
  const note = agency.data?.accessStatusNote;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 20%, rgba(180, 83, 9, 0.12), transparent 55%), radial-gradient(ellipse 60% 45% at 90% 75%, rgba(127, 29, 29, 0.08), transparent 50%), linear-gradient(165deg, #faf8f5 0%, #f3efe8 100%)",
        }}
      />

      <div className="relative z-[1] mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <BrandLogo variant="primary" height={40} />

        <div className="mt-10 rounded-2xl border border-line bg-white/90 p-6 shadow-lg sm:p-8">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              blocked
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            <Icon className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="mt-5 font-display text-3xl text-ink">{title}</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">{name}</span> is currently{" "}
            {status
              ? AGENCY_ACCESS_STATUS_LABEL[status].toLowerCase()
              : "restricted"}
            . Console tools and directory listing are unavailable until OkayNow
            restores access.
          </p>
          {note ? (
            <p className="mt-4 rounded-lg border border-line bg-surface/70 px-3 py-2 text-sm text-ink">
              {note}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-ink-muted">
            Contact OkayNow support if you believe this is a mistake.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-6"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
