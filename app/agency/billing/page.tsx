"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, Download, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import {
  createAgencyCheckoutSession,
  downloadAgencyHoursExport,
  getAgencyConnectStatus,
  getAgencySubscriptionPlans,
  getMyAgency,
  startAgencyConnectOnboarding,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import {
  SUBSCRIPTION_PLAN_LABEL,
  type SubscriptionPlan,
} from "@/lib/types";

export default function AgencyBillingPage() {
  const params = useSearchParams();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const agency = useQuery({
    queryKey: ["agency-me"],
    queryFn: getMyAgency,
  });
  const planCatalog = useQuery({
    queryKey: ["agency-subscription-plans"],
    queryFn: getAgencySubscriptionPlans,
  });
  const connect = useQuery({
    queryKey: ["agency-connect"],
    queryFn: getAgencyConnectStatus,
  });

  const checkout = useMutation({
    mutationFn: (plan: SubscriptionPlan) => createAgencyCheckoutSession(plan),
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      showToast(
        result.message ?? "Billing is not configured in this environment.",
        "info",
      );
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const onboard = useMutation({
    mutationFn: startAgencyConnectOnboarding,
    onSuccess: (result) => {
      if (result.onboardingUrl) {
        window.location.href = result.onboardingUrl;
        return;
      }
      showToast(result.message ?? "Connect is not available.", "info");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const exportHours = useMutation({
    mutationFn: () => downloadAgencyHoursExport(from, to),
    onSuccess: async (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agency-hours-${from}-to-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Hours export downloaded", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function onExport(e: FormEvent) {
    e.preventDefault();
    exportHours.mutate();
  }

  const checkoutResult = params.get("checkout");
  const connectResult = params.get("connect");
  const currentPlan = agency.data?.subscriptionPlan ?? "STARTER";
  const plans = planCatalog.data ?? [];

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Subscription
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">Billing</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          OkayNow charges a SaaS subscription. Homes pay your agency via Stripe
          Connect. You run your own W-2 payroll — export hours below for Gusto,
          ADP, or your payroll provider.
        </p>
      </section>

      {checkoutResult === "success" ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Checkout completed — your subscription should activate shortly.
        </p>
      ) : null}
      {checkoutResult === "cancel" ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checkout was cancelled. You can try again when ready.
        </p>
      ) : null}
      {connectResult === "return" || connectResult === "refresh" ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Connect onboarding updated. Refresh if status has not caught up yet.
        </p>
      ) : null}

      {agency.data ? (
        <div className="rounded-xl border border-brand/25 bg-brand-soft/20 p-5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-deep">
            Active plan
          </p>
          <p className="mt-1 font-display text-xl text-ink">
            {SUBSCRIPTION_PLAN_LABEL[agency.data.subscriptionPlan]}
          </p>
          <p className="mt-1 text-ink-muted">
            Status: <strong>{agency.data.subscriptionStatus}</strong>
            {agency.data.subscriptionPeriodEnd ? (
              <>
                {" "}
                · Period ends{" "}
                {new Date(agency.data.subscriptionPeriodEnd).toLocaleDateString()}
              </>
            ) : null}
          </p>
          {!agency.data.stripeConfigured ? (
            <p className="mt-3 text-ink-muted">
              Stripe is not configured in this environment. New agencies start on
              Starter with a 14-day trial; contact platform support for production
              activation.
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-xl text-ink">Choose a plan</h2>
        {planCatalog.isLoading ? (
          <p className="text-sm text-ink-muted">Loading plans…</p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.plan;
            return (
              <article
                key={plan.plan}
                className={`flex flex-col rounded-xl border bg-white p-5 shadow-sm ${
                  isCurrent ? "border-brand ring-1 ring-brand/20" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <CreditCard className="h-6 w-6 shrink-0 text-brand" aria-hidden />
                  {isCurrent ? (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Current plan
                    </span>
                  ) : plan.plan === "STARTER" ? (
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                      Default
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 font-display text-lg">{plan.displayName}</h3>
                {plan.priceDisplay ? (
                  <p className="mt-1 text-sm font-medium text-ink">{plan.priceDisplay}</p>
                ) : null}
                {plan.tagline ? (
                  <p className="mt-2 text-sm text-ink-muted">{plan.tagline}</p>
                ) : null}
                <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-muted">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                        aria-hidden
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5"
                  variant={isCurrent ? "secondary" : "primary"}
                  disabled={
                    isCurrent || checkout.isPending || !agency.data?.stripeConfigured
                  }
                  onClick={() => checkout.mutate(plan.plan)}
                >
                  {isCurrent
                    ? "Current plan"
                    : checkout.isPending
                      ? "Redirecting…"
                      : "Subscribe"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-brand" aria-hidden />
          <h2 className="font-display text-xl text-ink">Stripe Connect</h2>
        </div>
        <p className="max-w-xl text-sm text-ink-muted">
          Connect your Stripe account to collect private-pay invoices from homes.
          Caregiver pay stays on your payroll — OkayNow only records hours.
        </p>
        <div className="rounded-xl border border-border bg-white p-5 text-sm">
          {connect.data ? (
            <>
              <p>
                Status:{" "}
                <strong>
                  {connect.data.onboardingComplete
                    ? "Ready to collect payments"
                    : connect.data.hasConnectAccount
                      ? "Onboarding in progress"
                      : "Not connected"}
                </strong>
              </p>
              <p className="mt-1 text-ink-muted">
                Charges {connect.data.chargesEnabled ? "enabled" : "pending"} ·
                Payouts {connect.data.payoutsEnabled ? "enabled" : "pending"}
              </p>
            </>
          ) : (
            <p className="text-ink-muted">Loading Connect status…</p>
          )}
          <Button
            className="mt-4"
            variant="secondary"
            disabled={onboard.isPending || !connect.data?.stripeConfigured}
            onClick={() => {
              onboard.mutate();
              queryClient.invalidateQueries({ queryKey: ["agency-connect"] });
            }}
          >
            {onboard.isPending
              ? "Redirecting…"
              : connect.data?.onboardingComplete
                ? "Update Connect account"
                : "Set up Stripe Connect"}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-brand" aria-hidden />
          <h2 className="font-display text-xl text-ink">Hours export</h2>
        </div>
        <p className="max-w-xl text-sm text-ink-muted">
          Download EVV-backed hours and pay amounts for your payroll provider.
          OkayNow does not issue W-2s or pay caregivers.
        </p>
        <form
          onSubmit={onExport}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-white p-5"
        >
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Button type="submit" disabled={exportHours.isPending}>
            {exportHours.isPending ? "Exporting…" : "Download CSV"}
          </Button>
        </form>
      </section>
    </div>
  );
}
