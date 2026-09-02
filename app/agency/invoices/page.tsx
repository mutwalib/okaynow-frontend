"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAgencyInvoices, sendAgencyInvoice } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { useToast } from "@/lib/toast-context";

export default function AgencyInvoicesPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const invoices = useQuery({
    queryKey: ["agency-invoices"],
    queryFn: getAgencyInvoices,
  });

  const send = useMutation({
    mutationFn: sendAgencyInvoice,
    onSuccess: () => {
      showToast("Invoice sent to the home", "success");
      queryClient.invalidateQueries({ queryKey: ["agency-invoices"] });
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          Collections
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">Home invoices</h1>
        <p className="mt-2 max-w-xl text-ink-muted">
          Invoices for completed care. Send drafts to homes; they pay into your
          Stripe Connect account. OkayNow does not hold client payments.
        </p>
      </section>

      <div className="space-y-3">
        {invoices.isLoading ? <p className="text-ink-muted">Loading…</p> : null}
        {!invoices.isLoading && (invoices.data?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <Receipt className="mx-auto h-10 w-10 text-brand/50" aria-hidden />
            <p className="mt-3 font-medium">No invoices yet</p>
            <p className="mt-1 text-sm text-ink-muted">
              Enable auto-invoice in Rates, or complete agency shifts to generate
              invoices.
            </p>
          </div>
        ) : null}
        {invoices.data?.map((inv) => (
          <article
            key={inv.id}
            className="rounded-xl border border-border bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{inv.invoiceNumber}</p>
                <p className="text-sm text-ink-muted">
                  {[inv.clientFirstName, inv.clientLastName].filter(Boolean).join(" ")
                    || inv.facilityName
                    || "Client"}{" "}
                  · {inv.status} · Due {formatDate(inv.dueDate)}
                </p>
              </div>
              <p className="font-display text-xl tabular-nums">
                {formatMoney(Number(inv.totalAmount))}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {inv.status === "DRAFT" ? (
                <Button
                  size="sm"
                  onClick={() => send.mutate(inv.id)}
                  disabled={send.isPending}
                >
                  {send.isPending ? "Sending…" : "Send to home"}
                </Button>
              ) : null}
              {inv.status === "SENT" ? (
                <p className="text-sm text-ink-muted">
                  Awaiting payment
                  {inv.payableOnline ? " (online pay available)" : ""}
                </p>
              ) : null}
              {inv.status === "PAID" ? (
                <p className="text-sm text-emerald-700">Paid</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
