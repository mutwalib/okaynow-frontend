"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, Link2, PartyPopper, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { getMyAgency } from "@/lib/api";
import { SUBSCRIPTION_PLAN_LABEL, SUBSCRIPTION_STATUS_LABEL } from "@/lib/types";

function welcomeStorageKey(agencyId: string) {
  return `okaynow.agency.welcome.dismissed.${agencyId}`;
}

export default function AgencyHomePage() {
  const agency = useQuery({
    queryKey: ["agency-me"],
    queryFn: getMyAgency,
  });

  const data = agency.data;
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!data?.id || !data.accessAllowsConsole || !data.approvedAt) {
      setShowWelcome(false);
      return;
    }
    try {
      if (localStorage.getItem(welcomeStorageKey(data.id))) {
        setShowWelcome(false);
        return;
      }
    } catch {
      /* ignore */
    }
    const approvedMs = Date.parse(data.approvedAt);
    if (!Number.isFinite(approvedMs)) {
      setShowWelcome(false);
      return;
    }
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    setShowWelcome(Date.now() - approvedMs < sevenDays);
  }, [data]);

  function dismissWelcome() {
    if (data?.id) {
      try {
        localStorage.setItem(welcomeStorageKey(data.id), "1");
      } catch {
        /* ignore */
      }
    }
    setShowWelcome(false);
  }

  return (
    <div className="space-y-8">
      <section className="animate-rise">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Agency console
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">
          {data?.displayName ?? "Your agency"}
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Manage your subscription, directory listing, and home connections.
        </p>
      </section>

      {showWelcome && data ? (
        <div className="relative overflow-hidden rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-5 text-teal-950">
          <button
            type="button"
            onClick={dismissWelcome}
            className="absolute right-3 top-3 rounded p-1 text-teal-800/70 hover:bg-white/50 hover:text-teal-950"
            aria-label="Dismiss welcome"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" aria-hidden />
            <div>
              <p className="font-display text-xl">Welcome — you&apos;re approved</p>
              <p className="mt-1 text-sm leading-relaxed">
                {data.displayName} is live on OkayNow. You&apos;re on the{" "}
                <span className="font-semibold">
                  {SUBSCRIPTION_PLAN_LABEL[data.subscriptionPlan]}
                </span>{" "}
                plan
                {data.subscriptionStatus === "TRIAL" && data.subscriptionPeriodEnd
                  ? ` (trial through ${new Date(data.subscriptionPeriodEnd).toLocaleDateString()})`
                  : null}
                . Invite caregivers to your roster, connect with homes, and set up
                your directory profile.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink href="/agency/roster" size="sm">
                  Invite caregivers
                </ButtonLink>
                <ButtonLink href="/agency/settings" size="sm" variant="secondary">
                  Directory profile
                </ButtonLink>
                <Button type="button" size="sm" variant="ghost" onClick={dismissWelcome}>
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {data && !data.subscriptionAllowsWrites ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Subscription inactive</p>
            <p className="mt-1 text-sm">
              Renew billing to accept connections and update your directory profile.
            </p>
            <ButtonLink href="/agency/settings/billing" className="mt-3" size="sm">
              Go to billing
            </ButtonLink>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/agency/connections"
          className="rounded-xl border border-border bg-white p-5 shadow-sm hover:border-brand/30"
        >
          <Link2 className="h-6 w-6 text-brand" aria-hidden />
          <h2 className="mt-3 font-display text-lg">Home connections</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Review and accept connection requests from families.
          </p>
        </Link>
        <Link
          href="/agency/settings"
          className="rounded-xl border border-border bg-white p-5 shadow-sm hover:border-brand/30"
        >
          <Building2 className="h-6 w-6 text-brand" aria-hidden />
          <h2 className="mt-3 font-display text-lg">Directory profile</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Public description, qualifications, and listing visibility.
          </p>
        </Link>
      </div>

      {data ? (
        <section className="rounded-xl border border-border bg-white p-5 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-ink-muted">Plan</dt>
              <dd className="font-medium">
                {SUBSCRIPTION_PLAN_LABEL[data.subscriptionPlan]}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Status</dt>
              <dd className="font-medium">
                {SUBSCRIPTION_STATUS_LABEL[data.subscriptionStatus]}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Directory</dt>
              <dd className="font-medium">
                {data.directoryListed ? "Listed" : "Not listed"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Public URL</dt>
              <dd>
                <Link href={`/agencies/${data.slug}`} className="text-brand hover:underline">
                  /agencies/{data.slug}
                </Link>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
