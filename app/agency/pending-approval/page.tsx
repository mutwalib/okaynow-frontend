"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, LogOut, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { getMyAgency } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AgencyPendingApprovalPage() {
  const { logout } = useAuth();
  const agency = useQuery({
    queryKey: ["agency-me"],
    queryFn: getMyAgency,
    refetchInterval: 20_000,
  });

  const name = agency.data?.displayName ?? "your agency";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(14, 116, 144, 0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(15, 118, 110, 0.14), transparent 50%), linear-gradient(165deg, #f7faf9 0%, #eef5f3 45%, #e8f0f4 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
                  backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230e7490' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-[1] mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        <BrandLogo variant="primary" height={40} />

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-[0_20px_50px_-28px_rgba(15,70,80,0.45)] backdrop-blur-sm">
          <div className="relative border-b border-line/60 px-6 pb-8 pt-8 sm:px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg shadow-teal-900/20">
              <ClipboardCheck className="h-8 w-8" aria-hidden />
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-teal-500/10" />
            <div className="pointer-events-none absolute right-10 top-8 h-16 w-16 rounded-full bg-cyan-600/10" />

            <h1 className="relative mt-6 font-display text-3xl tracking-tight text-ink">
              Thank you for signing up
            </h1>
            <p className="relative mt-3 text-base leading-relaxed text-ink-muted">
              We received <span className="font-medium text-ink">{name}</span>
              &apos;s registration. Our team is reviewing your information and
              will approve access shortly.
            </p>
          </div>

          <div className="space-y-4 px-6 py-6 sm:px-8">
            <div className="flex gap-3 rounded-xl bg-surface/80 px-4 py-3 text-sm text-ink">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"
                aria-hidden
              />
              <p>
                You&apos;ll get full console access—including your Starter trial
                plan—as soon as approval is complete. No further action is needed
                right now.
              </p>
            </div>
            <p className="text-xs text-ink-muted">
              This page refreshes automatically. You can safely sign out and
              return later.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
