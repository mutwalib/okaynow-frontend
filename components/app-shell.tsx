"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { LegalAcceptanceGate } from "@/components/legal-acceptance-gate";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABEL, type UserRole } from "@/lib/types";
import { Button } from "./ui/button";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SIDEBAR_COLLAPSED_KEY = "okaynow-marketplace-sidebar-collapsed";

export function AppShell({
  role,
  nav,
  title,
  children,
}: {
  role: UserRole;
  nav: NavItem[];
  title?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function isActive(href: string) {
    if (href === `/${role.toLowerCase()}`) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const homeHref = `/${role.toLowerCase()}`;
  const sidebarWidth = !ready || !collapsed ? "md:w-56" : "md:w-16";
  const contentOffset = !ready || !collapsed ? "md:pl-56" : "md:pl-16";

  return (
    <div className="min-h-screen atmosphere text-ink">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line/70 bg-paper/95 backdrop-blur-md transition-[width] duration-200 md:flex ${sidebarWidth}`}
      >
        <div
          className={`border-b border-line/70 ${
            collapsed
              ? "flex flex-col items-center gap-1 px-1.5 py-2.5"
              : "flex items-center justify-between gap-2 px-3 py-3"
          }`}
        >
          {collapsed ? (
            <Link
              href={homeHref}
              className="flex h-8 w-8 items-center justify-center rounded font-display text-sm font-semibold text-brand-deep"
              title="OkayNow"
            >
              ON
            </Link>
          ) : (
            <Link href={homeHref} className="min-w-0 flex-1">
              <div className="font-display text-lg font-semibold tracking-tight text-brand-deep">
                OkayNow
              </div>
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                {ROLE_LABEL[role]}
              </div>
            </Link>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`shrink-0 text-ink-muted hover:bg-surface-2 hover:text-ink ${
              collapsed ? "h-8 w-8 px-0" : ""
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`inline-flex items-center rounded-md py-2 text-sm font-medium transition ${
                  collapsed ? "justify-center px-2" : "gap-2.5 px-3"
                } ${
                  isActive(item.href)
                    ? "bg-brand-soft text-brand-deep"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t border-line/70 ${collapsed ? "p-2" : "p-3"}`}>
          {!collapsed ? (
            <div className="mb-2 px-1">
              <div className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                {ROLE_LABEL[role]}
              </div>
              <div className="truncate text-sm text-ink">{user?.email}</div>
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className={`text-ink-muted hover:bg-surface-2 hover:text-ink ${
              collapsed ? "w-full justify-center px-2" : "w-full justify-start"
            }`}
            title={collapsed ? "Sign out" : undefined}
            onClick={logout}
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            {!collapsed ? "Sign out" : null}
          </Button>
        </div>
      </aside>

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ${contentOffset}`}
      >
        <header className="sticky top-0 z-[80] flex items-center justify-between gap-3 border-b border-line/70 bg-paper/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
          <div className="min-w-0">
            <Link
              href={homeHref}
              className="font-display text-base font-semibold text-brand-deep md:hidden"
            >
              OkayNow
            </Link>
            <p className="hidden truncate text-sm text-ink-muted md:block">
              {user?.email ?? ROLE_LABEL[role]}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell tone="marketplace" />
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={logout}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Sign out
            </Button>
          </div>
        </header>

        <nav className="sticky top-[3.25rem] z-[70] flex gap-1 overflow-x-auto border-b border-line/60 bg-paper/95 px-2 py-1.5 backdrop-blur-md md:hidden">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                  isActive(item.href)
                    ? "bg-brand-soft text-brand-deep"
                    : "text-ink-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {title ? (
            <h1 className="mb-6 font-display text-3xl text-ink animate-rise">
              {title}
            </h1>
          ) : null}
          <LegalAcceptanceGate>{children}</LegalAcceptanceGate>
        </main>
      </div>
    </div>
  );
}
