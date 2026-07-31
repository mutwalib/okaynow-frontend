"use client";

import Link from "next/link";
import { MapPinned, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

export type OpenShiftOffer = {
  id: string;
  shiftId: string;
  title: string;
  body: string;
  city?: string | null;
  date?: string | null;
  qualification?: string | null;
  payRate?: number | null;
};

export function OpenShiftOfferBanner({
  offer,
  onDismiss,
}: {
  offer: OpenShiftOffer | null;
  onDismiss: () => void;
}) {
  if (!offer) return null;

  const meta = [
    offer.date,
    offer.city,
    offer.qualification,
    offer.payRate != null ? `${formatMoney(Number(offer.payRate))}/hr` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[220] flex justify-center p-3 sm:p-4"
      role="dialog"
      aria-label="New open shift"
    >
      <div className="pointer-events-auto w-full max-w-md animate-rise overflow-hidden rounded-xl border border-brand/30 bg-paper shadow-[0_12px_40px_rgba(9,85,88,0.22)]">
        <div className="flex items-start gap-3 bg-gradient-to-br from-brand/12 via-paper to-paper px-4 py-3.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
            <Zap className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              New open shift
            </p>
            <p className="mt-0.5 font-display text-lg leading-snug text-ink">
              {offer.title}
            </p>
            {meta ? (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-muted">
                <MapPinned className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {meta}
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-muted">{offer.body}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <ButtonLinkSafe href={`/caregiver/shifts/${offer.shiftId}`}>
                View & claim
              </ButtonLinkSafe>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onDismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
          <button
            type="button"
            className="rounded p-1 text-ink-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Dismiss"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function ButtonLinkSafe({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white shadow-[0_1px_0_rgba(9,85,88,0.25)] transition hover:bg-brand-deep"
    >
      {children}
    </Link>
  );
}
