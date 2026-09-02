"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, Link2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getMyAgency } from "@/lib/api";
import { SUBSCRIPTION_PLAN_LABEL } from "@/lib/types";

export default function AgencyHomePage() {
  const agency = useQuery({
    queryKey: ["agency-me"],
    queryFn: getMyAgency,
  });

  const data = agency.data;

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

      {data && !data.subscriptionAllowsWrites ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Subscription inactive</p>
            <p className="mt-1 text-sm">
              Renew billing to accept connections and update your directory profile.
            </p>
            <ButtonLink href="/agency/billing" className="mt-3" size="sm">
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
              <dd className="font-medium">{data.subscriptionStatus}</dd>
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
