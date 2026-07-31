"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { getMyClientProfile, getShifts } from "@/lib/api";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, LoadingBlock, ShiftCard } from "@/components/shift-card";

export default function ClientHomePage() {
  const profile = useQuery({
    queryKey: ["client-me"],
    queryFn: getMyClientProfile,
    retry: false,
  });

  const shifts = useQuery({
    queryKey: ["client-shifts-preview"],
    queryFn: async () => {
      const page = await getShifts({ size: 5 });
      return page.content;
    },
    retry: false,
    enabled: profile.data?.canViewShifts === true,
  });

  return (
    <div className="space-y-10">
      <section className="animate-rise">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Family / client workspace
        </p>
        <h1 className="mt-1 font-display text-4xl text-ink">
          {profile.data
            ? `Welcome, ${profile.data.firstName}`
            : "Request care when you need it"}
        </h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Request private home care for your household. You only see shifts you
          post — other families and facilities are not shared with you.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {profile.data?.canCreateShifts ? (
            <ButtonLink href="/client/shifts/new" size="lg">
              <PlusCircle className="h-5 w-5" aria-hidden />
              Post a shift
            </ButtonLink>
          ) : null}
          <ButtonLink href="/client/profile" variant="secondary" size="lg">
            Care profile
          </ButtonLink>
        </div>
      </section>

      {profile.data?.canViewShifts ? (
      <section className="animate-rise-delay">
        <h2 className="mb-3 font-display text-2xl text-ink">Recent posts</h2>
        {shifts.isLoading ? <LoadingBlock /> : null}
        {shifts.isError ? (
          <EmptyState
            title="No shifts yet"
            body="Post your first shift to get started."
            action={
              profile.data.canCreateShifts ? (
                <ButtonLink href="/client/shifts/new">
                  <PlusCircle className="h-4 w-4" aria-hidden />
                  Post a shift
                </ButtonLink>
              ) : undefined
            }
          />
        ) : null}
        {!shifts.isLoading && !shifts.isError && (shifts.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No shifts yet"
            body="Post your first shift to get started."
            action={
              profile.data.canCreateShifts ? (
                <ButtonLink href="/client/shifts/new">
                  <PlusCircle className="h-4 w-4" aria-hidden />
                  Post a shift
                </ButtonLink>
              ) : undefined
            }
          />
        ) : null}
        {(shifts.data?.length ?? 0) > 0 ? (
          <div className="rounded-lg border border-line bg-paper px-4 sm:px-5">
            {shifts.data?.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                href={`/client/shifts/${shift.id}`}
                showBillRate
              />
            ))}
          </div>
        ) : null}
      </section>
      ) : profile.data ? (
        <p className="rounded-lg border border-line bg-paper p-5 text-sm text-ink-muted">
          Shift viewing is disabled for this account. Contact the agency if you need access.
        </p>
      ) : null}
    </div>
  );
}
