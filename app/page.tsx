import Link from "next/link";
import {
  ArrowRight,
  Building2,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  LogIn,
  Users,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function LandingPage() {
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
          <span className="font-display text-2xl tracking-tight text-white animate-fade">
            OkayNow
          </span>
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
          <p className="font-display text-5xl leading-[1.05] text-white sm:text-7xl lg:text-8xl animate-rise">
            OkayNow
          </p>
          <h1 className="mt-4 max-w-xl text-xl font-medium text-white/95 sm:text-2xl animate-rise-delay">
            Home care shifts, filled in Massachusetts.
          </h1>
          <p className="mt-3 max-w-lg text-base text-white/80 animate-rise-delay">
            Caregivers pick up open shifts with clear pay and location. Families
            and facilities post care when they need it.
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
            Built for how Massachusetts home care actually works
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            Transparent pay and bill rates, qualification-aware matching, and a
            shift board your agency can trust — designed around W-2 staffing,
            not gig-economy guesswork.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                title: "Caregivers",
                body: "Browse open shifts by pay, distance, and credential. Claim what fits your week.",
                Icon: HeartPulse,
              },
              {
                title: "Families & facilities",
                body: "Post one-off or recurring needs with clear rates and care notes.",
                Icon: Users,
              },
              {
                title: "Agency admins",
                body: "Oversee the board, fill rates, and rates across your book of business.",
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
          <span className="font-display text-lg text-brand-deep">OkayNow</span>
          <span>Massachusetts home care staffing</span>
        </div>
      </footer>
    </div>
  );
}
