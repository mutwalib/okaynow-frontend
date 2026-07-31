"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClientRates,
  getPlatformConversionCaregivers,
  getReportedConversionCaregiverIds,
  reportPlatformConversion,
} from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ConfirmModal } from "@/components/ui/modal";
import { useToast } from "@/lib/toast-context";
import { useMemo, useState } from "react";

/** Self-report off-platform hire of a caregiver found via OkayNow. */
export function PlatformConversionPanel() {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [caregiverId, setCaregiverId] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const rates = useQuery({ queryKey: ["client-rates"], queryFn: getClientRates });
  const caregivers = useQuery({
    queryKey: ["platform-conversion-caregivers"],
    queryFn: getPlatformConversionCaregivers,
  });
  const reported = useQuery({
    queryKey: ["reported-conversion-caregivers"],
    queryFn: getReportedConversionCaregiverIds,
  });
  const fee = Number(rates.data?.platformConversionFee ?? 0);
  const reportedIds = useMemo(
    () => new Set(reported.data ?? []),
    [reported.data],
  );
  const options = useMemo(
    () =>
      (caregivers.data ?? [])
        .filter((c) => !reportedIds.has(c.caregiverProfileId))
        .map((c) => ({
          value: c.caregiverProfileId,
          label: `${c.firstName} ${c.lastName}`.trim(),
          searchText: `${c.firstName} ${c.lastName}`.trim(),
        })),
    [caregivers.data, reportedIds],
  );
  const selected = options.find((o) => o.value === caregiverId) ?? null;
  const caregiverLabel = selected?.label ?? null;

  const report = useMutation({
    mutationFn: () =>
      reportPlatformConversion(caregiverId, notes.trim() || undefined),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ["my-invoices"] });
      qc.invalidateQueries({ queryKey: ["my-facility-invoices"] });
      qc.invalidateQueries({ queryKey: ["reported-conversion-caregivers"] });
      qc.invalidateQueries({ queryKey: ["platform-conversion-caregivers"] });
      setCaregiverId("");
      setNotes("");
      setConfirmOpen(false);
      showToast(
        `Conversion fee invoiced${inv?.invoiceNumber ? ` (${inv.invoiceNumber})` : ""} — ${formatMoney(fee)}`,
        "success",
      );
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (fee <= 0) return null;

  const allReported =
    (caregivers.data?.length ?? 0) > 0 && options.length === 0;
  const noneConnected =
    !caregivers.isLoading && (caregivers.data?.length ?? 0) === 0;

  return (
    <div className="rounded-lg border border-line bg-paper p-4 space-y-3">
      <h2 className="font-medium text-ink">Hired a caregiver off-platform?</h2>
      <p className="text-sm text-ink-muted">
        Per OkayNow Terms, if you continue care privately with a caregiver you
        connected with here, the platform conversion fee is{" "}
        <span className="font-medium text-ink">{formatMoney(fee)}</span>.
        Report it to receive an invoice. Caregivers already invoiced for a
        conversion fee are hidden below.
      </p>
      {caregivers.isLoading ? (
        <p className="text-sm text-ink-muted">Loading caregivers…</p>
      ) : allReported ? (
        <p className="text-sm text-ink-muted">
          Every caregiver you&apos;ve connected with already has a conversion fee
          invoice.
        </p>
      ) : noneConnected ? (
        <p className="text-sm text-ink-muted">
          No caregivers from your roster or past shifts yet. Once someone works
          a shift with you, they&apos;ll appear here to select.
        </p>
      ) : (
        <Field label="Caregiver">
          <SearchableSelect
            options={options}
            value={caregiverId}
            onChange={setCaregiverId}
            placeholder="Search by name…"
            emptyMessage="No matching caregivers"
            disabled={report.isPending}
          />
        </Field>
      )}
      <Field label="Notes (optional)">
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Ongoing private-pay arrangement"
        />
      </Field>
      <Button
        size="sm"
        disabled={
          !caregiverId ||
          reportedIds.has(caregiverId) ||
          report.isPending ||
          allReported ||
          noneConnected
        }
        onClick={() => setConfirmOpen(true)}
      >
        Report &amp; invoice fee
      </Button>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm conversion fee"
        confirmLabel={`Invoice ${formatMoney(fee)}`}
        cancelLabel="Not now"
        busy={report.isPending}
        onClose={() => {
          if (!report.isPending) setConfirmOpen(false);
        }}
        onConfirm={() => report.mutate()}
        body={
          <div className="space-y-3">
            <p className="text-ink-muted">
              Report an off-platform hire
              {caregiverLabel ? (
                <>
                  {" "}
                  of{" "}
                  <span className="font-medium text-ink">{caregiverLabel}</span>
                </>
              ) : null}{" "}
              and generate a conversion fee invoice?
            </p>
            <div className="rounded-lg border border-line bg-surface px-4 py-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                Platform conversion fee
              </p>
              <p className="mt-1 font-display text-3xl text-ink">
                {formatMoney(fee)}
              </p>
            </div>
            <p className="text-xs text-ink-muted">
              This matches OkayNow Terms for continuing care privately with a
              caregiver you met on the platform. An invoice will be added to your
              billing.
            </p>
          </div>
        }
      />
    </div>
  );
}
