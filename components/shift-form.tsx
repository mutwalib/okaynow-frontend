"use client";

import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LucideIcon } from "lucide-react";
import { QUALIFICATIONS, type Qualification } from "@/lib/types";
import { getClientRates } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import {
  DEFAULT_STATE,
  maZipMessage,
  SERVICE_REGION_LABEL,
} from "@/lib/service-region";
import { Field, Input, Select, Textarea } from "./ui/field";
import { Button } from "./ui/button";

const schema = z
  .object({
    requiredQualification: z.enum(["CNA", "HHA", "PCA", "LPN", "RN"]),
    scheduleType: z.enum(["ONE_OFF", "DAILY_ROUTINE"]),
    /** Required for one-off only; daily routines are ongoing (no date range). */
    date: z.string().optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    addressLine: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.literal(DEFAULT_STATE),
    zip: z.string().refine((v) => maZipMessage(v) === true, {
      message: "OkayNow currently accepts Massachusetts ZIP codes only (010–027)",
    }),
    requiredHeadcount: z.coerce
      .number({ invalid_type_error: "Caregivers needed is required" })
      .int()
      .min(1, "At least 1 caregiver")
      .max(50, "Maximum 50 caregivers"),
    assignFromRoster: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .refine((d) => d.endTime !== d.startTime, {
    message: "End time must differ from start time",
    path: ["endTime"],
  })
  .refine(
    (d) => d.scheduleType !== "ONE_OFF" || !!d.date,
    {
      message: "Date is required",
      path: ["date"],
    },
  );

export type ShiftFormValues = z.infer<typeof schema>;

export function ShiftForm({
  defaultValues,
  submitLabel = "Post shift",
  submitIcon: SubmitIcon,
  showRosterAssign = true,
  mode = "create",
  onSubmit,
}: {
  defaultValues?: Partial<ShiftFormValues>;
  submitLabel?: string;
  submitIcon?: LucideIcon;
  /** Family clients can auto-fill from caregiver roster; facilities cannot. */
  showRosterAssign?: boolean;
  /** Edit mode always shows the instance date (including daily-routine days). */
  mode?: "create" | "edit";
  onSubmit: (values: ShiftFormValues) => Promise<void>;
}) {
  const rates = useQuery({
    queryKey: ["client-rates"],
    queryFn: getClientRates,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      requiredQualification: "CNA",
      scheduleType: "ONE_OFF",
      state: DEFAULT_STATE,
      startTime: "09:00",
      endTime: "17:00",
      date: "",
      addressLine: "",
      city: "",
      zip: "",
      requiredHeadcount: 1,
      assignFromRoster: true,
      notes: "",
      ...defaultValues,
      state: DEFAULT_STATE,
    },
  });

  const scheduleType = watch("scheduleType");
  const assignFromRoster = watch("assignFromRoster");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const overnight =
    !!startTime && !!endTime && endTime !== startTime && endTime < startTime;
  const billRate = rates.data ? Number(rates.data.billRate) : null;
  const showDate = mode === "edit" || scheduleType === "ONE_OFF";
  const editing = mode === "edit";

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({ ...values, state: DEFAULT_STATE });
      })}
      className="space-y-5"
    >
      {!editing ? (
        <Field label="Schedule" error={errors.scheduleType?.message}>
          <Select {...register("scheduleType")}>
            <option value="ONE_OFF">One-off (single day)</option>
            <option value="DAILY_ROUTINE">Daily routine (ongoing every day)</option>
          </Select>
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Qualification" error={errors.requiredQualification?.message}>
          <Select {...register("requiredQualification")}>
            {QUALIFICATIONS.map((q: Qualification) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </Select>
        </Field>
        {showDate ? (
          <Field label="Date" error={errors.date?.message}>
            <Input type="date" {...register("date")} />
          </Field>
        ) : null}
        <Field label="Start" error={errors.startTime?.message}>
          <Input type="time" {...register("startTime")} />
        </Field>
        <Field label="End" error={errors.endTime?.message}>
          <Input type="time" {...register("endTime")} />
        </Field>
      </div>
      {overnight ? (
        <p className="text-xs text-ink-muted">
          Ends the next calendar day (overnight shift).
        </p>
      ) : null}
      {scheduleType === "DAILY_ROUTINE" && !editing ? (
        <p className="text-xs text-ink-muted">
          Ongoing every day at these hours — no end date. Days are filled from
          your roster by default. If someone calls out, open that day on the
          schedule to post it to the marketplace for that date only.
        </p>
      ) : null}

      <Field label="Street address" error={errors.addressLine?.message}>
        <Input placeholder="123 Main St" {...register("addressLine")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" error={errors.city?.message}>
          <Input {...register("city")} />
        </Field>
        <Field label="State" error={errors.state?.message}>
          <Input
            readOnly
            title={`OkayNow currently operates in ${SERVICE_REGION_LABEL} only`}
            {...register("state")}
            value={DEFAULT_STATE}
          />
          <span className="block text-xs text-ink-muted">
            {SERVICE_REGION_LABEL} only — more states later
          </span>
        </Field>
        <Field label="ZIP" error={errors.zip?.message}>
          <Input
            inputMode="numeric"
            placeholder="02108"
            {...register("zip")}
          />
        </Field>
      </div>

      <div className="rounded-md border border-line bg-canvas/40 px-3 py-3 text-sm">
        <p className="font-medium text-ink">Your bill rate</p>
        {rates.isLoading ? (
          <p className="mt-1 text-ink-muted">Loading agency rate…</p>
        ) : rates.isError || billRate == null || !Number.isFinite(billRate) ? (
          <p className="mt-1 text-danger">Could not load agency bill rate.</p>
        ) : (
          <>
            <p className="mt-1 text-lg tabular-nums text-ink">
              {formatMoney(billRate)}
              <span className="text-sm font-normal text-ink-muted">/hr</span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Set by the agency. Not editable here.
            </p>
          </>
        )}
      </div>

      <Field
        label="Caregivers needed"
        error={errors.requiredHeadcount?.message}
      >
        <Input
          type="number"
          min={1}
          max={50}
          step={1}
          {...register("requiredHeadcount")}
        />
        <span className="mt-1 block text-xs text-ink-muted">
          How many caregivers this shift needs (e.g. 2 for two CNAs at once).
        </span>
      </Field>

      {scheduleType === "DAILY_ROUTINE" && showRosterAssign && !editing ? (
        <label className="flex cursor-pointer items-start gap-2 rounded-md border border-line bg-canvas/40 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={!!assignFromRoster}
            onChange={(e) =>
              setValue("assignFromRoster", e.target.checked, {
                shouldValidate: true,
              })
            }
          />
          <span>
            <span className="font-medium text-ink">
              Assign from my caregiver roster
            </span>
            <span className="mt-0.5 block text-xs text-ink-muted">
              Fills each day with PRIMARY (then rotational) caregivers when
              available. Call out on a calendar day to open the marketplace for
              that date only.
            </span>
          </span>
        </label>
      ) : null}

      <Field label="Notes" error={errors.notes?.message}>
        <Textarea
          placeholder="Care tasks, access notes, preferences…"
          {...register("notes")}
        />
      </Field>

      <Button
        type="submit"
        disabled={isSubmitting || rates.isLoading || rates.isError}
        size="lg"
      >
        {SubmitIcon && !isSubmitting ? (
          <SubmitIcon className="h-5 w-5" aria-hidden />
        ) : null}
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
