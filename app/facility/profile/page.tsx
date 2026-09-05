"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyFacilityProfile, updateMyFacilityProfile } from "@/lib/api";
import { DEFAULT_STATE, SERVICE_REGION_LABEL, maZipMessage } from "@/lib/service-region";
import { useToast } from "@/lib/toast-context";
import { Save } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/shift-card";
import { DeleteAccountSection } from "@/components/delete-account-section";

type FormValues = {
  contactFirstName: string;
  contactLastName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

export default function FacilityProfilePage() {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["facility-me"],
    queryFn: getMyFacilityProfile,
  });

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (!profile.data) return;
    reset({
      contactFirstName: profile.data.contactFirstName,
      contactLastName: profile.data.contactLastName,
      phone: profile.data.phone ?? "",
      addressLine: profile.data.addressLine,
      city: profile.data.city,
      state: DEFAULT_STATE,
      zip: profile.data.zip,
      notes: profile.data.notes ?? "",
    });
  }, [profile.data, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const zipCheck = maZipMessage(values.zip);
      if (zipCheck !== true) throw new Error(zipCheck);
      return updateMyFacilityProfile({
        contactFirstName: profile.data!.contactFirstName,
        contactLastName: profile.data!.contactLastName,
        phone: values.phone || null,
        addressLine: values.addressLine,
        city: values.city,
        state: DEFAULT_STATE,
        zip: values.zip,
        notes: values.notes || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facility-me"] });
      showToast("Facility profile saved", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (profile.isLoading) return <LoadingBlock />;
  if (profile.isError || !profile.data) {
    return (
      <p className="text-danger">
        Could not load facility profile. If this account was created before
        facility profiles existed, register a new facility account.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Facility profile</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Keep your contact details and service address current for shift posting.
        </p>
      </div>

      <form
        className="space-y-4 rounded-lg border border-line bg-paper p-5"
        onSubmit={handleSubmit((v) => save.mutate(v))}
      >
        <Field label="Facility name">
          <Input value={profile.data.facilityName} disabled readOnly />
          <p className="mt-1 text-xs text-ink-muted">
            Facility name is set at registration and cannot be changed here.
          </p>
        </Field>

        <Field label="Account email">
          <Input value={profile.data.email} disabled readOnly />
          <p className="mt-1 text-xs text-ink-muted">
            Login email cannot be changed from this screen.
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact first name">
            <Input
              readOnly
              disabled
              value={profile.data.contactFirstName}
              title="Contact name is locked after registration"
            />
          </Field>
          <Field label="Contact last name">
            <Input
              readOnly
              disabled
              value={profile.data.contactLastName}
              title="Contact name is locked after registration"
            />
          </Field>
        </div>
        <p className="text-xs text-ink-muted">
          Contact names and facility name are set at registration and cannot be
          changed here. Contact OkayNow support if a correction is required.
        </p>

        <Field label="Phone">
          <Input type="tel" {...register("phone")} />
        </Field>

        <Field label="Facility address">
          <Input {...register("addressLine", { required: true })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City">
            <Input {...register("city", { required: true })} />
          </Field>
          <Field label="State">
            <Input
              readOnly
              required
              value={DEFAULT_STATE}
              title={`OkayNow currently operates in ${SERVICE_REGION_LABEL} only`}
              {...register("state", { required: true })}
            />
            <span className="block text-xs text-ink-muted">
              {SERVICE_REGION_LABEL} only — more states later
            </span>
          </Field>
          <Field label="ZIP">
            <Input
              required
              inputMode="numeric"
              placeholder="02108"
              {...register("zip", { required: true })}
            />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea
            placeholder="Parking, entrance instructions, unit info…"
            {...register("notes")}
          />
        </Field>

        <Button type="submit" disabled={save.isPending}>
          {!save.isPending ? <Save className="h-4 w-4" aria-hidden /> : null}
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <DeleteAccountSection />
    </div>
  );
}
