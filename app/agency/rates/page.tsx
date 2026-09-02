"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import {
  getAgencyTenantSettings,
  updateAgencyTenantSettings,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import type { AgencyTenantSettings } from "@/lib/types";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const PERIODS = ["WEEKLY", "BIWEEKLY"] as const;

export default function AgencyRatesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: ["agency-settings"],
    queryFn: getAgencyTenantSettings,
  });
  const [form, setForm] = useState<AgencyTenantSettings | null>(null);

  useEffect(() => {
    if (settings.data) {
      setForm(settings.data);
    }
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => updateAgencyTenantSettings(form!),
    onSuccess: (data) => {
      setForm(data);
      queryClient.setQueryData(["agency-settings"], data);
      showToast("Rate settings saved", "success");
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
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Economics</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Rates & invoicing</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Set caregiver pay and your margin. Bill rate is derived as pay ÷ (1 − take%).
          OkayNow does not run payroll — export hours from Billing when you process W-2s.
        </p>
      </section>

      <form onSubmit={onSubmit} className="max-w-lg space-y-4 rounded-xl border border-border bg-white p-5">
        <Field label="Default caregiver pay ($/hr)" required>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.defaultPayRate}
            onChange={(e) =>
              setForm({ ...form, defaultPayRate: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Agency take (% of bill)" required>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="99.99"
            value={form.agencyTakePercent}
            onChange={(e) =>
              setForm({ ...form, agencyTakePercent: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Pay period" required>
          <Select
            value={form.payPeriodType}
            onChange={(e) =>
              setForm({
                ...form,
                payPeriodType: e.target.value as AgencyTenantSettings["payPeriodType"],
              })
            }
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Period start day" required>
          <Select
            value={form.periodStartDay}
            onChange={(e) =>
              setForm({
                ...form,
                periodStartDay: e.target.value as AgencyTenantSettings["periodStartDay"],
              })
            }
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.autoInvoiceOnComplete}
            onChange={(e) =>
              setForm({ ...form, autoInvoiceOnComplete: e.target.checked })
            }
          />
          Auto-create home invoice when a shift completes
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.autoInvoiceSendImmediately}
            onChange={(e) =>
              setForm({ ...form, autoInvoiceSendImmediately: e.target.checked })
            }
          />
          Send invoice immediately (otherwise leave as draft)
        </label>
        <Field label="Caregiver rejection fee ($)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.clientCaregiverRejectionFee}
            onChange={(e) =>
              setForm({
                ...form,
                clientCaregiverRejectionFee: Number(e.target.value),
              })
            }
          />
        </Field>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
