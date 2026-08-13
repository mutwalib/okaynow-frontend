"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  LogIn,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { homePathForUser } from "@/lib/types";

export default function LandingPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      router.replace(homePathForUser(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=2400&q=80)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0a3d40]/95 via-[#0d7377]/78 to-[#0d7377]/35"
          aria-hidden
        />

        <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
          <BrandLogo
            variant="primary"
            priority
            height={40}
            className="animate-fade"
          />
          <div className="flex items-center gap-2 animate-fade">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in
            </Link>
            <ButtonLink
              href="/register"
              className="!bg-white !text-brand-deep hover:!bg-brand-soft"
              size="sm"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              Get started
            </ButtonLink>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 flex-col justify-end px-6 pb-16 pt-24 sm:px-10 sm:pb-24">
          <BrandLogo
            variant="primary"
            priority
            height={80}
            className="max-w-full animate-rise"
          />
          <h1 className="mt-4 max-w-xl text-xl font-medium text-white/95 sm:text-2xl animate-rise-delay">
            Same caregivers. Clear rates. Massachusetts home care that runs.
          </h1>
          <p className="mt-3 max-w-lg text-base text-white/80 animate-rise-delay">
            Not another gig board. OkayNow keeps families with caregivers they
            know, fills gaps when needed, and runs W-2 pay, visits, and invoices
            in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-rise-delay-2">
            <ButtonLink
              href="/register?role=CAREGIVER"
              className="!bg-white !text-brand-deep hover:!bg-brand-soft"
              size="lg"
            >
              <HandHeart className="h-5 w-5" aria-hidden />
              I&apos;m a caregiver
            </ButtonLink>
            <ButtonLink
              href="/register?role=CLIENT"
              variant="secondary"
              className="!border-white/40 !bg-transparent !text-white hover:!bg-white/10"
              size="lg"
            >
              <HeartHandshake className="h-5 w-5" aria-hidden />
              I need care
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="atmosphere px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            Built for agencies — not for Uber-for-nursing chaos
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Continuity first (primary roster, private invite), marketplace only
            when you need it. Transparent bill vs pay, EVV-ready home visits,
            and facility surge when ratios are on the line.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Families",
                body: "Prefer the same caregiver week to week. Call out to your roster before the open board.",
                Icon: HeartHandshake,
              },
              {
                title: "Caregivers",
                body: "Clear pay, real addresses, travel-aware home shifts — W-2 employment, not 1099 guesswork.",
                Icon: HeartPulse,
              },
              {
                title: "Agency ops",
                body: "One cockpit: open seats, expiring credentials, unpaid invoices, visit exceptions.",
                Icon: Building2,
              },
            ].map((item) => (
              <div key={item.title}>
                <item.Icon className="h-5 w-5 text-brand-deep" aria-hidden />
                <h3 className="mt-2 font-display text-xl text-brand-deep">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-paper px-6 py-8 text-sm text-ink-muted sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <BrandLogo variant="primary" height={32} />
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/support" className="hover:text-brand-deep">
              Support
            </Link>
            <Link href="/account-deletion" className="hover:text-brand-deep">
              Delete account
            </Link>
            <Link href="/privacy" className="hover:text-brand-deep">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-brand-deep">
              Terms
            </Link>
          </nav>
          <span>Massachusetts home care staffing</span>
        </div>
      </footer>
    </div>
  );
}
