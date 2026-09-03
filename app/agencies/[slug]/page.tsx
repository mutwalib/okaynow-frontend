"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { getAgencyPublicProfile, requestHomeAgencyConnection } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  agencyConnectionsPath,
  canConnectWithAgencies,
  QUALIFICATION_LABELS,
  SUBSCRIPTION_PLAN_LABEL,
} from "@/lib/types";
import { useState } from "react";

export default function AgencyPublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const profile = useQuery({
    queryKey: ["agency-public", slug],
    queryFn: () => getAgencyPublicProfile(slug),
    enabled: Boolean(slug),
  });

  const connect = useMutation({
    mutationFn: () => requestHomeAgencyConnection(profile.data!.id, message),
    onSuccess: () => {
      showToast("Connection request sent", "success");
      queryClient.invalidateQueries({ queryKey: ["home-agency-connections"] });
      if (user && canConnectWithAgencies(user.role)) {
        router.push(agencyConnectionsPath(user.role));
      }
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function handleConnect() {
    if (!isAuthenticated || !canConnectWithAgencies(user?.role)) {
      router.push(`/login?next=/agencies/${slug}`);
      return;
    }
    connect.mutate();
  }

  const canConnect = isAuthenticated && canConnectWithAgencies(user?.role);
  const isFacility = user?.role === "FACILITY";

  if (profile.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
        Loading…
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <div className="min-h-screen atmosphere px-6 py-16 text-center">
        <p className="text-ink-muted">Agency not found or not listed.</p>
        <ButtonLink href="/agencies" className="mt-4">
          Back to directory
        </ButtonLink>
      </div>
    );
  }

  const agency = profile.data;

  return (
    <div className="min-h-screen atmosphere">
      <header className="border-b border-border/60 bg-white/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <BrandLogo variant="primary" height={32} />
          <Link
            href="/agencies"
            className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Directory
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-brand-soft p-3">
              <Building2 className="h-8 w-8 text-brand" aria-hidden />
            </div>
            <div>
              <h1 className="font-display text-3xl text-ink">{agency.displayName}</h1>
              <p className="mt-1 text-sm text-ink-muted">
                {SUBSCRIPTION_PLAN_LABEL[agency.subscriptionPlan]} agency
              </p>
              {(agency.city || agency.state) && (
                <p className="mt-2 flex items-center gap-1 text-sm text-ink-muted">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {[agency.addressLine, agency.city, agency.state, agency.zip]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>

          {agency.hiringOpen ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Hiring caregivers
              {agency.hiringNote ? ` — ${agency.hiringNote}` : ""}
            </p>
          ) : null}

          {agency.publicDescription ? (
            <p className="mt-6 whitespace-pre-wrap text-ink-muted">
              {agency.publicDescription}
            </p>
          ) : null}

          {agency.qualificationsSupported.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                Qualifications
              </h2>
              <p className="mt-2 text-sm text-ink">
                {agency.qualificationsSupported
                  .map((q) => QUALIFICATION_LABELS[q])
                  .join(" · ")}
              </p>
            </div>
          ) : null}

          <div className="mt-8 rounded-xl border border-brand/20 bg-brand-soft/30 p-5">
            <h2 className="font-display text-lg text-ink">Connect with this agency</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {isFacility
                ? "Free for facilities. Once connected, you can route coverage needs to this agency."
                : "Free for homes. Once connected, you can send care requests to this agency."}
            </p>
            {canConnect ? (
              <>
                <textarea
                  className="mt-4 w-full rounded-md border border-border bg-white p-3 text-sm"
                  rows={3}
                  placeholder={
                    isFacility
                      ? "Optional message (site needs, typical hours, etc.)"
                      : "Optional message (care needs, schedule, etc.)"
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                  className="mt-3"
                  onClick={handleConnect}
                  disabled={connect.isPending}
                >
                  {connect.isPending ? "Sending…" : "Request connection"}
                </Button>
              </>
            ) : isAuthenticated ? (
              <p className="mt-4 text-sm text-ink-muted">
                Sign in with a family/home or facility account to request a
                connection. Caregiver and agency accounts cannot connect from
                the directory.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/register?role=CLIENT&next=/agencies/${slug}`}>
                  Create free home account
                </ButtonLink>
                <ButtonLink href={`/register?role=FACILITY&next=/agencies/${slug}`}>
                  Register facility
                </ButtonLink>
                <ButtonLink href={`/login?next=/agencies/${slug}`} variant="secondary">
                  Sign in to connect
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
