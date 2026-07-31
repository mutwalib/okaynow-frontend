"use client";

import { useQuery } from "@tanstack/react-query";
import { downloadMyInvoicePdf, getMyInvoices } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { useListPagination } from "@/lib/pagination";
import { LoadingBlock } from "@/components/shift-card";
import { PlatformConversionPanel } from "@/components/platform-conversion-panel";
import { Button } from "@/components/ui/button";
import { ListPagination } from "@/components/ui/list-pagination";
import { useToast } from "@/lib/toast-context";
import { Printer, Receipt } from "lucide-react";
import { useState } from "react";

export default function ClientBillingPage() {
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const { page, setPage, pageSize, setPageSize } = useListPagination();
  const invoices = useQuery({
    queryKey: ["my-invoices", page, pageSize],
    queryFn: () => getMyInvoices(page, pageSize),
  });
  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-rise">
      <div>
        <h1 className="inline-flex items-center gap-2 font-display text-3xl text-ink">
          <Receipt className="h-7 w-7 text-ink-muted" aria-hidden />
          Billing
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Invoices from OkayNow for completed care. Download a PDF to print or
          save. Pay by the due date (or contact the agency). If you hire a
          caregiver you met here for ongoing private care, report it below —
          the platform conversion fee in your rate card / Terms applies.
        </p>
      </div>

      <PlatformConversionPanel />

      {invoices.isLoading ? <LoadingBlock /> : null}
      {invoices.isError ? (
        <p className="text-sm text-danger">Could not load invoices.</p>
      ) : null}

      <div className="space-y-3">
        {(invoices.data?.content ?? []).map((inv) => (
          <article
            key={inv.id}
            className="rounded-lg border border-line bg-paper p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink">{inv.invoiceNumber}</p>
                <p className="text-xs text-ink-muted">
                  Issued {formatDate(inv.issuedDate)} · Due{" "}
                  {formatDate(inv.dueDate)} · {inv.status}
                </p>
              </div>
              <p className="font-display text-2xl text-ink tabular-nums">
                {formatMoney(Number(inv.totalAmount))}
              </p>
            </div>
            {inv.notes ? (
              <p className="mt-2 text-sm text-ink-muted">{inv.notes}</p>
            ) : null}
            <ul className="mt-3 space-y-1 text-sm text-ink-muted">
              {inv.lines.map((line) => (
                <li key={line.id}>
                  {formatDate(line.shiftDate)} · {Number(line.hours).toFixed(1)}{" "}
                  hrs · {formatMoney(Number(line.amount))}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={busyId === inv.id}
                onClick={async () => {
                  setBusyId(inv.id);
                  try {
                    await downloadMyInvoicePdf(inv.id, inv.invoiceNumber);
                    showToast("Invoice PDF downloaded", "success");
                  } catch (err) {
                    showToast(
                      err instanceof Error ? err.message : "PDF failed",
                      "error",
                    );
                  } finally {
                    setBusyId(null);
                  }
                }}
              >
                <Printer className="h-4 w-4" aria-hidden />
                {busyId === inv.id ? "Preparing…" : "Download PDF"}
              </Button>
              {inv.status === "SENT" ? (
                <p className="text-sm font-medium text-brand-deep">
                  Payment requested — please pay by {formatDate(inv.dueDate)}.
                </p>
              ) : null}
              {inv.status === "PAID" ? (
                <p className="text-sm text-success">Paid. Thank you.</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!invoices.isLoading && (invoices.data?.content.length ?? 0) === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
          No invoices yet.
        </p>
      ) : null}
      {invoices.data ? (
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalElements={invoices.data.totalElements}
          totalPages={invoices.data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={invoices.isFetching}
        />
      ) : null}
    </div>
  );
}
