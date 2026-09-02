"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { AgencyDirectoryBrowser } from "@/components/agency-directory-browser";
import { ButtonLink } from "@/components/ui/button";

export default function AgencyDirectoryPage() {
  return (
    <div className="min-h-screen atmosphere">
      <header className="border-b border-border/60 bg-white/80 px-6 py-4 backdrop-blur sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <BrandLogo variant="primary" height={36} />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted hover:bg-brand-soft/40"
            >
              Sign in
            </Link>
            <ButtonLink href="/register?role=CLIENT" size="sm">
              Join free
            </ButtonLink>
          </div>
        </div>
      </header>

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
          Are you an agency?{" "}
          <Link href="/register/agency" className="text-brand hover:underline">
            Start your subscription
          </Link>
          {" · "}
          Caregiver looking for work?{" "}
          <Link href="/register?role=CAREGIVER" className="text-brand hover:underline">
            Create a free profile
          </Link>
        </p>
      </main>
    </div>
  );
}
