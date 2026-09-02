"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import {
  getAgencyTenantSettings,
  updateAgencyTenantSettings,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import type { AgencyTenantSettings } from "@/lib/types";

export default function AgencyStaffingPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["agency-settings"],
    queryFn: getAgencyTenantSettings,
  });
  const [form, setForm] = useState<AgencyTenantSettings | null>(null);

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => updateAgencyTenantSettings(form!),
    onSuccess: (data) => {
      setForm(data);
      queryClient.setQueryData(["agency-settings"], data);
      showToast("Staffing settings saved", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    save.mutate();
  }

  if (!form) {
    return <p className="text-ink-muted">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Operations</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Shift routing & limits</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Control how home care requests reach your caregivers, how many open shifts
          they can hold, and travel time between visits at different homes.
        </p>
      </section>

      <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
        <section className="space-y-3 rounded-xl border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-brand" aria-hidden />
            <h2 className="font-display text-lg text-ink">Incoming home requests</h2>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
            <input
              type="radio"
              name="routing"
              checked={form.shiftRoutingMode === "INBOX_FIRST"}
              onChange={() => setForm({ ...form, shiftRoutingMode: "INBOX_FIRST" })}
            />
            <span>
              <span className="font-medium text-ink">Inbox first (recommended)</span>
              <span className="mt-1 block text-sm text-ink-muted">
                Accepted requests land in your shift inbox. You broadcast to roster
                caregivers in the area or assign someone specific.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4">
            <input
              type="radio"
              name="routing"
              checked={form.shiftRoutingMode === "AUTO_BROADCAST"}
              onChange={() => setForm({ ...form, shiftRoutingMode: "AUTO_BROADCAST" })}
            />
            <span>
              <span className="font-medium text-ink">Auto-broadcast to area roster</span>
              <span className="mt-1 block text-sm text-ink-muted">
                When you accept a home request, the shift is posted immediately to
                active roster caregivers within their service radius — they can pick
                it up in real time.
              </span>
            </span>
          </label>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-white p-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" aria-hidden />
            <h2 className="font-display text-lg text-ink">Caregiver limits</h2>
          </div>
          <Field label="Max incomplete shifts per caregiver">
            <Input
              type="number"
              min="0"
              max="50"
              value={form.maxIncompleteShiftsPerCaregiver}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxIncompleteShiftsPerCaregiver: Number(e.target.value),
                })
              }
            />
            <p className="mt-1 text-xs text-ink-muted">
              Pending or confirmed shifts not yet completed. Use 0 for no limit.
            </p>
          </Field>
          <Field label="Minimum buffer between shifts at different homes (minutes)">
            <Input
              type="number"
              min="0"
              max="240"
              value={form.minBufferMinutesBetweenShifts}
              onChange={(e) =>
                setForm({
                  ...form,
                  minBufferMinutesBetweenShifts: Number(e.target.value),
                })
              }
            />
            <p className="mt-1 text-xs text-ink-muted">
              Extra time after drive time when back-to-back visits are at different homes.
            </p>
          </Field>
          <Field label="Max drive time between different homes (minutes)">
            <Input
              type="number"
              min="0"
              max="240"
              value={form.maxDriveMinutesBetweenShifts}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxDriveMinutesBetweenShifts: Number(e.target.value),
                })
              }
            />
            <p className="mt-1 text-xs text-ink-muted">
              Reject when estimated drive between consecutive shifts exceeds this. 0 disables.
            </p>
          </Field>
          <p className="text-xs text-ink-muted">
            Overlapping shift times are always blocked. Distance rules apply when a
            caregiver would travel from one client home to another on the same day.
          </p>
        </section>

        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save staffing settings"}
        </Button>
      </form>
    </div>
  );
}
