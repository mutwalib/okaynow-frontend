"use client";

import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { AgencyDirectoryBrowser } from "@/components/agency-directory-browser";
import { useAuth } from "@/lib/auth-context";
import { canConnectWithAgencies } from "@/lib/types";

export default function AgencyDirectoryPage() {
  const { user, isAuthenticated } = useAuth();
  const signedInHome = isAuthenticated && canConnectWithAgencies(user?.role);

  return (
    <div className="min-h-screen atmosphere">
      <MarketingHeader />

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <section className="animate-rise">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            Agency directory
          </p>
          <h1 className="mt-1 font-display text-4xl text-ink">
            Find a home care agency in Massachusetts
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Browse subscribed agencies by city or ZIP, compare qualifications,
            and connect for free. Homes never pay OkayNow.
          </p>
        </section>

        <section className="mt-8">
          <AgencyDirectoryBrowser
            emptyTitle="No agencies match yet"
            emptyBody="Try clearing filters, or check back as more agencies subscribe."
          />
        </section>

        <p className="mt-10 text-center text-sm text-ink-muted">
          {signedInHome ? (
            <>
              Looking for your connections?{" "}
              <Link
                href={user?.role === "FACILITY" ? "/facility/agencies" : "/client/agencies"}
                className="text-brand hover:underline"
              >
                Open connected agencies
              </Link>
            </>
          ) : (
            <>
              Are you an agency?{" "}
              <Link href="/register/agency" className="text-brand hover:underline">
                Start your subscription
              </Link>
              {" · "}
              Caregiver looking for work?{" "}
              <Link
                href="/register?role=CAREGIVER"
                className="text-brand hover:underline"
              >
                Create a free profile
              </Link>
            </>
          )}
        </p>
      </main>
    </div>
  );
}
