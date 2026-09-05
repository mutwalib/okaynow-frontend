"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import Link from "next/link";
import { CaregiverVerificationDisclaimer } from "@/components/caregiver-verification-disclaimer";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export type MarketplaceCoverageDraft = {
  shiftId: string;
  maxSlots: number;
  defaultSlots: number;
  mode: "remaining" | "replace";
  required: number;
  filled: number;
  remaining: number;
  marketOpen: number;
  timeLabel?: string;
};

export type CoverageAgencyOption = {
  agencyId: string;
  agencyDisplayName: string;
};

export function MarketplaceCoverageModal({
  draft,
  busy = false,
  connectedAgencies,
  onClose,
  onConfirm,
}: {
  draft: MarketplaceCoverageDraft | null;
  busy?: boolean;
  /** When set, route the opening to selected connected agencies instead of the marketplace. */
  connectedAgencies?: CoverageAgencyOption[];
  onClose: () => void;
  onConfirm: (slots: number, agencyIds?: string[]) => void;
}) {
  const [slots, setSlots] = useState(1);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const agencyMode = connectedAgencies != null;

  useEffect(() => {
    if (!draft) return;
    setSlots(
      Math.min(draft.maxSlots, Math.max(1, draft.defaultSlots || draft.maxSlots)),
    );
    // Force an explicit single-agency choice each time the modal opens.
    setSelectedAgencyId("");
  }, [draft?.shiftId, draft?.maxSlots, draft?.defaultSlots]);

  if (!draft) return null;

  const open = draft.maxSlots >= 1;
  const title = agencyMode
    ? draft.mode === "replace"
      ? "Call out — choose an agency"
      : "Send opening to an agency"
    : draft.mode === "replace"
      ? "Call out — open marketplace"
      : "Open marketplace coverage";

  const canConfirm =
    !busy &&
    (!agencyMode ||
      (connectedAgencies.length > 0 && !!selectedAgencyId));

  return (
    <Modal
      open={open}
      title={title}
      size={agencyMode ? "lg" : "md"}
      onClose={busy ? () => undefined : onClose}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canConfirm}
            onClick={() =>
              onConfirm(
                slots,
                agencyMode && selectedAgencyId
                  ? [selectedAgencyId]
                  : undefined,
              )
            }
          >
            <Megaphone className="h-4 w-4" aria-hidden />
            {busy
              ? agencyMode
                ? "Sending…"
                : "Opening…"
              : agencyMode
                ? selectedAgencyId
                  ? "Send to agency"
                  : "Select an agency"
                : slots === 1
                  ? "Open 1 slot"
                  : `Open ${slots} slots`}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {draft.timeLabel ? (
          <p className="font-medium tabular-nums text-ink">{draft.timeLabel}</p>
        ) : null}

        {agencyMode ? (
          <fieldset className="rounded-lg border border-line bg-canvas/50 p-3">
            <legend className="px-1 text-sm font-semibold text-ink">
              Which agency should receive this opening?
            </legend>
            <p className="mt-1 text-sm text-ink-muted">
              Send each opening to exactly one agency. That agency staffs it
              with its roster (inbox or auto-broadcast).
            </p>
            {connectedAgencies.length === 0 ? (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
                Connect with at least one agency first.{" "}
                <Link
                  href="/facility/agencies"
                  className="font-medium text-brand underline"
                >
                  View agencies
                </Link>
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {connectedAgencies.map((a) => {
                  const checked = selectedAgencyId === a.agencyId;
                  return (
                    <label
                      key={a.agencyId}
                      className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition ${
                        checked
                          ? "border-brand bg-brand/5 text-ink"
                          : "border-line bg-paper text-ink hover:border-brand/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="coverage-agency"
                        className="h-4 w-4 accent-[var(--brand,#0f766e)]"
                        disabled={busy}
                        checked={checked}
                        onChange={() => setSelectedAgencyId(a.agencyId)}
                      />
                      <span className="font-medium">{a.agencyDisplayName}</span>
                    </label>
                  );
                })}
                {!selectedAgencyId ? (
                  <p className="mt-2 text-xs text-warn">
                    Select one agency to continue.
                  </p>
                ) : null}
              </div>
            )}
          </fieldset>
        ) : null}

        <p className="text-ink-muted">
          {draft.mode === "remaining" ? (
            <>
              {draft.remaining} of {draft.required} caregiver slot
              {draft.required === 1 ? "" : "s"} still unfilled
              {agencyMode
                ? ""
                : draft.marketOpen > 0
                  ? ` (${draft.marketOpen} already on the marketplace)`
                  : ""}
              . Choose how many remaining seats to open for this date.
              Unopened seats stay private.
            </>
          ) : (
            <>
              All {draft.filled} slot{draft.filled === 1 ? "" : "s"} are filled.
              Choose how many caregivers to request
              {agencyMode
                ? " from the agencies you select"
                : " so the marketplace can fill those seats"}{" "}
              for this date only.
            </>
          )}
        </p>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {agencyMode ? "Caregivers needed" : "Marketplace slots"}
          </p>
          {draft.maxSlots === 1 ? (
            <p className="mt-2 text-sm text-ink">1 slot will open</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from({ length: draft.maxSlots }, (_, i) => i + 1).map(
                (n) => {
                  const selected = slots === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={busy}
                      onClick={() => setSlots(n)}
                      className={`min-w-[2.75rem] rounded-md border px-3 py-2 text-sm font-medium tabular-nums transition ${
                        selected
                          ? "border-brand bg-brand text-white"
                          : "border-line bg-canvas text-ink hover:border-brand"
                      }`}
                    >
                      {n}
                    </button>
                  );
                },
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-ink-muted">
            {slots} of {draft.maxSlots} available to open
            {draft.mode === "replace" && !agencyMode
              ? " — that many assignments will be released"
              : ""}
          </p>
        </div>

        <CaregiverVerificationDisclaimer
          audience={agencyMode ? "facility" : "home"}
        />
      </div>
    </Modal>
  );
}
