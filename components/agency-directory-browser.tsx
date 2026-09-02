"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { searchAgencyDirectory } from "@/lib/api";
import {
  QUALIFICATION_LABELS,
  QUALIFICATIONS,
  SUBSCRIPTION_PLAN_LABEL,
  type Qualification,
} from "@/lib/types";

type Props = {
  /** When true, only agencies with hiringOpen */
  hiringOnly?: boolean;
  compact?: boolean;
  profileHref?: (slug: string) => string;
  emptyTitle?: string;
  emptyBody?: string;
};

export function AgencyDirectoryBrowser({
  hiringOnly = false,
  compact = false,
  profileHref = (slug) => `/agencies/${slug}`,
  emptyTitle = "No agencies match yet",
  emptyBody = "Try another city or ZIP, or clear filters.",
}: Props) {
  const [qualification, setQualification] = useState<"" | Qualification>("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [appliedZip, setAppliedZip] = useState("");

  const directory = useQuery({
    queryKey: [
      "agency-directory",
      qualification,
      appliedCity,
      appliedZip,
      hiringOnly,
    ],
    queryFn: () =>
      searchAgencyDirectory({
        qualification: qualification || undefined,
        city: appliedCity || undefined,
        zip: appliedZip || undefined,
        hiringOnly: hiringOnly || undefined,
      }),
  });

  function applyLocation() {
    setAppliedCity(city.trim());
    setAppliedZip(zip.trim());
  }

  const items = directory.data ?? [];

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-wrap gap-3 rounded-xl border border-border bg-white p-4 ${
          compact ? "" : "shadow-sm"
        }`}
      >
        <Field label="Qualification" className="min-w-[160px] flex-1">
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
        <Field label="City" className="min-w-[140px] flex-1">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Boston"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLocation();
              }
            }}
          />
        </Field>
        <Field label="ZIP" className="min-w-[120px] flex-1">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm"
              placeholder="02108"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLocation();
                }
              }}
            />
          </div>
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            onClick={applyLocation}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
          >
            Search
          </button>
        </div>
      </div>

      {directory.isLoading ? (
        <p className="text-ink-muted">Loading agencies…</p>
      ) : null}
      {directory.isError ? (
        <p className="text-red-600">Could not load the directory.</p>
      ) : null}
      {!directory.isLoading && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-brand/60" aria-hidden />
          <p className="mt-3 font-medium text-ink">{emptyTitle}</p>
          <p className="mt-1 text-sm text-ink-muted">{emptyBody}</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((agency) => (
          <article
            key={agency.id}
            className="rounded-xl border border-border bg-white p-4 transition hover:border-brand/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={profileHref(agency.slug)}
                    className="font-display text-xl text-ink hover:text-brand"
                  >
                    {agency.displayName}
                  </Link>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-deep">
                    {SUBSCRIPTION_PLAN_LABEL[agency.subscriptionPlan]}
                  </span>
                  {agency.hiringOpen ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Hiring caregivers
                    </span>
                  ) : null}
                </div>
                {(agency.city || agency.state || agency.zip) && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {[agency.city, agency.state, agency.zip]
                      .filter(Boolean)
                      .join(", ")}
                    {agency.distanceMiles != null
                      ? ` · ${agency.distanceMiles.toFixed(1)} mi`
                      : null}
                  </p>
                )}
                {agency.hiringNote ? (
                  <p className="mt-1 text-sm text-brand-deep">{agency.hiringNote}</p>
                ) : null}
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
              <ButtonLink href={profileHref(agency.slug)} variant="secondary">
                View profile
              </ButtonLink>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
