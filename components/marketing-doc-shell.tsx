import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";

export function MarketingDocShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-paper px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <Link href="/" className="inline-block">
            <BrandLogo variant="primary" height={32} />
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            <Link href="/support" className="hover:text-brand-deep">
              Support
            </Link>
            <Link href="/privacy" className="hover:text-brand-deep">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-brand-deep">
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 sm:px-10">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        {updated ? (
          <p className="mt-2 text-xs text-ink-muted">Last updated {updated}</p>
        ) : null}
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </main>

      <footer className="border-t border-line bg-paper px-6 py-8 text-sm text-ink-muted sm:px-10">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} OkayNow</span>
          <Link href="/" className="hover:text-brand-deep">
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
