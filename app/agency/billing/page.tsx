"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAgencyCheckoutSession, getMyAgency } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import {
  SUBSCRIPTION_PLAN_LABEL,
  type SubscriptionPlan,
} from "@/lib/types";

const PLANS: SubscriptionPlan[] = ["STARTER", "PROFESSIONAL", "FEATURED"];

export default function AgencyBillingPage() {
  const params = useSearchParams();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const agency = useQuery({
    queryKey: ["agency-me"],
    queryFn: getMyAgency,
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

  const checkoutResult = params.get("checkout");

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Subscription
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">Billing</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          OkayNow charges agencies a SaaS subscription. Homes and caregivers use
          the platform for free.
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

      {agency.data ? (
        <div className="rounded-xl border border-border bg-white p-5 text-sm">
          <p>
            Current status:{" "}
            <strong>{agency.data.subscriptionStatus}</strong> (
            {SUBSCRIPTION_PLAN_LABEL[agency.data.subscriptionPlan]})
          </p>
          {agency.data.subscriptionPeriodEnd ? (
            <p className="mt-1 text-ink-muted">
              Period ends:{" "}
              {new Date(agency.data.subscriptionPeriodEnd).toLocaleDateString()}
            </p>
          ) : null}
          {!agency.data.stripeConfigured ? (
            <p className="mt-3 text-ink-muted">
              Stripe is not configured in this environment. New agencies start on
              a 14-day trial; contact platform support for production activation.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan}
            className="flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <CreditCard className="h-6 w-6 text-brand" aria-hidden />
            <h2 className="mt-3 font-display text-lg">
              {SUBSCRIPTION_PLAN_LABEL[plan]}
            </h2>
            <p className="mt-2 flex-1 text-sm text-ink-muted">
              {plan === "STARTER"
                ? "Directory listing, home connections, basic console."
                : plan === "PROFESSIONAL"
                  ? "Full scheduling, roster, and EVV (Phases B–D)."
                  : "Featured placement in the home directory."}
            </p>
            <Button
              className="mt-4"
              variant={plan === "PROFESSIONAL" ? "default" : "secondary"}
              disabled={checkout.isPending || !agency.data?.stripeConfigured}
              onClick={() => checkout.mutate(plan)}
            >
              {checkout.isPending ? "Redirecting…" : "Subscribe"}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
