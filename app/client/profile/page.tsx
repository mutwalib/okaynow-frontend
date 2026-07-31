"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyClientProfile, updateMyClientProfile, uploadClientPhoto } from "@/lib/api";
import { DEFAULT_STATE, SERVICE_REGION_LABEL, maZipMessage } from "@/lib/service-region";
import { useToast } from "@/lib/toast-context";
import { Save } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/shift-card";
import { ProfilePhotoField } from "@/components/profile-photo-field";

type FormValues = {
  firstName: string;
  lastName: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  careNeeds: string;
};

export default function ClientProfilePage() {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["client-me"],
    queryFn: getMyClientProfile,
  });

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (!profile.data) return;
    reset({
      firstName: profile.data.firstName,
      lastName: profile.data.lastName,
      addressLine: profile.data.addressLine ?? "",
      city: profile.data.city ?? "",
      state: DEFAULT_STATE,
      zip: profile.data.zip ?? "",
      careNeeds: profile.data.careNeeds ?? "",
    });
  }, [profile.data, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      if (values.zip && maZipMessage(values.zip) !== true) {
        throw new Error(String(maZipMessage(values.zip)));
      }
      return updateMyClientProfile({
        ...values,
        state: DEFAULT_STATE,
        addressLine: values.addressLine || null,
        city: values.city || null,
        zip: values.zip || null,
        careNeeds: values.careNeeds || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-me"] });
      showToast("Profile saved", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const photo = useMutation({
    mutationFn: uploadClientPhoto,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-me"] });
      showToast("Photo updated", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  if (profile.isLoading) return <LoadingBlock />;
  if (profile.isError) {
    return <p className="text-danger">Could not load profile.</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Care profile</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Home address and care needs help schedulers post accurate shifts.
        </p>
      </div>
      <form
        className="space-y-4 rounded-lg border border-line bg-paper p-5"
        onSubmit={handleSubmit((v) => save.mutate(v))}
      >
        <ProfilePhotoField
          photoUrl={profile.data?.profilePhotoUrl}
          name={`${profile.data?.firstName ?? ""} ${profile.data?.lastName ?? ""}`}
          uploading={photo.isPending}
          onUpload={(file) => photo.mutate(file)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input {...register("firstName", { required: true })} />
          </Field>
          <Field label="Last name">
            <Input {...register("lastName", { required: true })} />
          </Field>
        </div>
        <Field label="Street address">
          <Input {...register("addressLine")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City">
            <Input {...register("city")} />
          </Field>
          <Field label="State">
            <Input
              readOnly
              value={DEFAULT_STATE}
              title={`OkayNow currently operates in ${SERVICE_REGION_LABEL} only`}
              {...register("state")}
            />
            <span className="block text-xs text-ink-muted">
              {SERVICE_REGION_LABEL} only — more states later
            </span>
          </Field>
          <Field label="ZIP">
            <Input inputMode="numeric" placeholder="02108" {...register("zip")} />
          </Field>
        </div>
        <Field label="Care needs">
          <Textarea
            placeholder="ADLs, mobility, medication reminders…"
            {...register("careNeeds")}
          />
        </Field>
        <Button type="submit" disabled={save.isPending}>
          {!save.isPending ? <Save className="h-4 w-4" aria-hidden /> : null}
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
