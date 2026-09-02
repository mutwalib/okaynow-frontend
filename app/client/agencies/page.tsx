"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { AgencyDirectoryBrowser } from "@/components/agency-directory-browser";
import { getHomeAgencyConnections } from "@/lib/api";
import { CONNECTION_STATUS_LABEL } from "@/lib/types";

export default function ClientAgenciesPage() {
  const connections = useQuery({
    queryKey: ["home-agency-connections"],
    queryFn: getHomeAgencyConnections,
  });

  return (
    <div className="space-y-10">
      <section className="animate-rise">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Your agencies
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">Agencies</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Search the directory by city or ZIP, open profiles, and manage
          connections. Care requests go only to agencies you are connected with.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Browse directory</h2>
        <AgencyDirectoryBrowser compact />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Connected</h2>
        {connections.isLoading ? (
          <p className="text-ink-muted">Loading…</p>
        ) : null}
        {!connections.isLoading && (connections.data?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <Building2 className="mx-auto h-10 w-10 text-brand/50" aria-hidden />
            <p className="mt-3 font-medium">No agencies connected yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Use the search above, open a profile, and send a free connection
              request.
            </p>
          </div>
        ) : null}
        {connections.data?.map((c) => (
          <article
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4"
          >
            <div>
              <Link
                href={`/agencies/${c.agencySlug}`}
                className="font-medium text-ink hover:text-brand"
              >
                {c.agencyDisplayName}
              </Link>
              <p className="text-sm text-ink-muted">
                {[c.agencyCity, c.agencyState].filter(Boolean).join(", ")}
                {" · "}
                {CONNECTION_STATUS_LABEL[c.status]}
              </p>
              {c.homeMessage ? (
                <p className="mt-1 text-sm text-ink-muted">{c.homeMessage}</p>
              ) : null}
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                c.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-800"
                  : c.status === "PENDING"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {CONNECTION_STATUS_LABEL[c.status]}
            </span>
          </article>
        ))}
      </section>
    </div>
  );
}
