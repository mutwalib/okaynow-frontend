"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { searchAgencyDirectory } from "@/lib/api";
import {
  QUALIFICATION_LABELS,
  QUALIFICATIONS,
  SUBSCRIPTION_PLAN_LABEL,
  type Qualification,
} from "@/lib/types";
import { useMemo, useState } from "react";

export default function AgencyDirectoryPage() {
  const [qualification, setQualification] = useState<"" | Qualification>("");
  const [zip, setZip] = useState("");

  const directory = useQuery({
    queryKey: ["agency-directory", qualification, zip],
    queryFn: () =>
      searchAgencyDirectory({
        qualification: qualification || undefined,
      }),
  });

  const filtered = useMemo(() => {
    const items = directory.data ?? [];
    if (!zip.trim()) return items;
    const prefix = zip.trim().slice(0, 3);
    return items.filter(
      (a) => a.city?.toLowerCase().includes(zip.toLowerCase()) || true,
    );
  }, [directory.data, zip]);

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
            Browse subscribed agencies, compare qualifications, and connect for
            free. Homes never pay OkayNow — you choose who schedules your care.
          </p>
        </section>

        <section className="mt-8 flex flex-wrap gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
          <Field label="Qualification needed" className="min-w-[200px] flex-1">
            <Select
              value={qualification}
              onChange={(e) =>
                setQualification(e.target.value as "" | Qualification)
              }
            >
              <option value="">Any</option>
              {QUALIFICATIONS.map((q) => (
                <option key={q} value={q}>
                  {QUALIFICATION_LABELS[q]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="City or ZIP (optional)" className="min-w-[200px] flex-1">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <input
                className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm"
                placeholder="e.g. Boston or 02108"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </div>
          </Field>
        </section>

        <section className="mt-8 space-y-4">
          {directory.isLoading ? (
            <p className="text-ink-muted">Loading agencies…</p>
          ) : null}
          {directory.isError ? (
            <p className="text-red-600">Could not load the directory.</p>
          ) : null}
          {!directory.isLoading && filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
              <Building2 className="mx-auto h-10 w-10 text-brand/60" aria-hidden />
              <p className="mt-3 font-medium text-ink">No agencies match yet</p>
              <p className="mt-1 text-sm text-ink-muted">
                Try clearing filters, or check back as more agencies subscribe.
              </p>
            </div>
          ) : null}
          {filtered.map((agency) => (
            <article
              key={agency.id}
              className="rounded-xl border border-border bg-white p-5 shadow-sm transition hover:border-brand/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl text-ink">
                      {agency.displayName}
                    </h2>
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-deep">
                      {SUBSCRIPTION_PLAN_LABEL[agency.subscriptionPlan]}
                    </span>
                  </div>
                  {(agency.city || agency.state) && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {[agency.city, agency.state].filter(Boolean).join(", ")}
                      {agency.distanceMiles != null
                        ? ` · ${agency.distanceMiles.toFixed(1)} mi`
                        : null}
                    </p>
                  )}
                  {agency.publicDescriptionSnippet ? (
                    <p className="mt-2 text-sm text-ink-muted">
                      {agency.publicDescriptionSnippet}
                    </p>
                  ) : null}
                  {agency.qualificationsSupported.length > 0 ? (
                    <p className="mt-2 text-xs text-ink-muted">
                      {agency.qualificationsSupported
                        .map((q) => QUALIFICATION_LABELS[q])
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
                <ButtonLink href={`/agencies/${agency.slug}`} variant="secondary">
                  View profile
                </ButtonLink>
              </div>
            </article>
          ))}
        </section>

        <p className="mt-10 text-center text-sm text-ink-muted">
          Are you an agency?{" "}
          <Link href="/register?role=AGENCY_ADMIN" className="text-brand hover:underline">
            Start your subscription
          </Link>
        </p>
      </main>
    </div>
  );
}
