"use client";

import { Radio } from "lucide-react";
import { ShiftBoard } from "@/components/shift-board";
import { useRealtime } from "@/lib/realtime-context";

export default function CaregiverShiftsPage() {
  const { connected } = useRealtime();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink animate-rise">
            Open shifts
          </h1>
          <p className="mb-1 text-sm text-ink-muted animate-rise-delay">
            Marketplace opens and roster openings from agencies you belong to.
            Agency shifts show the agency name and are only visible to that
            roster.
          </p>
        </div>
        <p
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider animate-rise-delay ${
            connected
              ? "border-success/30 bg-success/10 text-success"
              : "border-warn/30 bg-warn/10 text-warn"
          }`}
        >
          <Radio className="h-3 w-3" aria-hidden />
          {connected ? "Live" : "Reconnecting"}
        </p>
      </div>
      <ShiftBoard
        basePath="/caregiver/shifts"
        defaultStatus="OPEN"
        allowClaim
        includeAgencyRoster
      />
    </div>
  );
}
