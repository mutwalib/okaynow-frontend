"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { homePathForUser } from "@/lib/types";

/** Public/marketing top bar that respects signed-in session. */
export function MarketingHeader({
  trailing,
}: {
  /** Optional extra control on the right (e.g. Directory back link). */
  trailing?: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <header className="border-b border-border/60 bg-white/80 px-6 py-4 backdrop-blur sm:px-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <BrandLogo variant="primary" height={36} />
        <div className="flex flex-wrap items-center justify-end gap-2">
          {trailing}
          {isLoading ? (
            <span className="px-3 py-2 text-sm text-ink-muted">…</span>
          ) : isAuthenticated && user ? (
            <ButtonLink href={homePathForUser(user)} size="sm">
              Go to dashboard
            </ButtonLink>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted hover:bg-brand-soft/40"
              >
                Sign in
              </Link>
              <ButtonLink href="/register?role=CLIENT" size="sm">
                Join free
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
