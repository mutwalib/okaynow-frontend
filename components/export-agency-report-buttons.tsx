"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import {
  downloadAgencyReport,
  type AgencyReportFormat,
  type AgencyReportType,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast-context";

export function ExportAgencyReportButtons({
  type,
  filters = {},
  className = "",
}: {
  type: AgencyReportType;
  filters?: Record<string, string | number | boolean | undefined | null>;
  className?: string;
}) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<AgencyReportFormat | null>(null);

  async function exportReport(format: AgencyReportFormat) {
    setBusy(format);
    try {
      await downloadAgencyReport(type, format, filters);
      showToast(
        format === "pdf" ? "PDF downloaded" : "Excel downloaded",
        "success",
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not generate report",
        "error",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={busy !== null}
        onClick={() => exportReport("xlsx")}
      >
        <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
        {busy === "xlsx" ? "Excel…" : "Export Excel"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={busy !== null}
        onClick={() => exportReport("pdf")}
      >
        <FileText className="h-3.5 w-3.5" aria-hidden />
        {busy === "pdf" ? "PDF…" : "Export PDF"}
      </Button>
    </div>
  );
}
