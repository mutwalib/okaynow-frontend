"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyCaregiverProfile, updateMyCaregiverProfile, uploadCaregiverPhoto, getMyPublishedReviews } from "@/lib/api";
import { QUALIFICATIONS, type Qualification } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import { Save, Star } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/shift-card";
import { ProfilePhotoField } from "@/components/profile-photo-field";

type FormValues = {
  firstName: string;
  lastName: string;
  hourlyRateMin: number | "";
  hourlyRateMax: number | "";
  serviceRadiusMiles: number | "";
  homeLat: number | "";
  homeLng: number | "";
  qualifications: Qualification[];
};

export default function CaregiverProfilePage() {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["caregiver-me"],
    queryFn: getMyCaregiverProfile,
  });
  const reviews = useQuery({
    queryKey: ["caregiver-me-reviews"],
    queryFn: getMyPublishedReviews,
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      hourlyRateMin: "",
      hourlyRateMax: "",
      serviceRadiusMiles: "",
      homeLat: "",
      homeLng: "",
      qualifications: [],
    },
  });

  const selected = watch("qualifications") ?? [];

  useEffect(() => {
    if (!profile.data) return;
    reset({
      firstName: profile.data.firstName,
      lastName: profile.data.lastName,
      hourlyRateMin: profile.data.hourlyRateMin ?? "",
      hourlyRateMax: profile.data.hourlyRateMax ?? "",
      serviceRadiusMiles: profile.data.serviceRadiusMiles ?? "",
      homeLat: profile.data.homeLat ?? "",
      homeLng: profile.data.homeLng ?? "",
      qualifications: profile.data.qualifications ?? [],
    });
  }, [profile.data, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      updateMyCaregiverProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        qualifications: values.qualifications,
        hourlyRateMin:
          values.hourlyRateMin === "" ? null : Number(values.hourlyRateMin),
        hourlyRateMax:
          values.hourlyRateMax === "" ? null : Number(values.hourlyRateMax),
        serviceRadiusMiles:
          values.serviceRadiusMiles === ""
            ? null
            : Number(values.serviceRadiusMiles),
        homeLat: values.homeLat === "" ? null : Number(values.homeLat),
        homeLng: values.homeLng === "" ? null : Number(values.homeLng),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver-me"] });
      showToast("Profile saved", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  const photo = useMutation({
    mutationFn: uploadCaregiverPhoto,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caregiver-me"] });
      showToast("Photo updated", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function toggleQual(q: Qualification) {
    const next = selected.includes(q)
      ? selected.filter((x) => x !== q)
      : [...selected, q];
    setValue("qualifications", next, { shouldDirty: true });
  }

  if (profile.isLoading) return <LoadingBlock />;

  if (profile.isError) {
    return (
      <p className="text-danger">
        Could not load profile. Sign in again or check the API.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Your profile</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Set your qualifications, pay range, and service area. Free OPEN shifts
          in your jurisdiction appear on the board for you to claim — assignments
          are not permanent.
        </p>
      </div>

      <form
        className="space-y-5 rounded-lg border border-line bg-paper p-5"
        onSubmit={handleSubmit((v) => save.mutate(v))}
      >
        <ProfilePhotoField
          photoUrl={profile.data?.profilePhotoUrl}
          name={`${profile.data?.firstName ?? ""} ${profile.data?.lastName ?? ""}`}
          uploading={photo.isPending}
          onUpload={(file) => photo.mutate(file)}
        />

        {profile.data?.ratingCount ? (
          <div className="flex items-center gap-2 text-sm text-ink">
            <Star
              className="h-4 w-4 text-brand"
              fill="currentColor"
              aria-hidden
            />
            <span className="tabular-nums font-medium">
              {Number(profile.data.ratingAvg).toFixed(1)}
            </span>
            <span className="text-ink-muted">
              · {profile.data.ratingCount} published review
              {profile.data.ratingCount === 1 ? "" : "s"}
            </span>
          </div>
        ) : (
          <p className="text-xs text-ink-muted">
            Client reviews appear here after an admin publishes them.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input {...register("firstName", { required: true })} />
          </Field>
          <Field label="Last name">
            <Input {...register("lastName", { required: true })} />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Qualifications</p>
          <div className="flex flex-wrap gap-2">
            {QUALIFICATIONS.map((q) => {
              const on = selected.includes(q);
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => toggleQual(q)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                    on
                      ? "border-brand bg-brand-soft text-brand-deep"
                      : "border-line bg-paper text-ink-muted hover:border-brand"
                  }`}
                >
                  {q}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min $/hr">
            <Input type="number" step="0.01" {...register("hourlyRateMin")} />
          </Field>
          <Field label="Max $/hr">
            <Input type="number" step="0.01" {...register("hourlyRateMax")} />
          </Field>
          <Field label="Radius (mi)">
            <Input type="number" {...register("serviceRadiusMiles")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Home latitude">
            <Input type="number" step="any" {...register("homeLat")} />
          </Field>
          <Field label="Home longitude">
            <Input type="number" step="any" {...register("homeLng")} />
          </Field>
        </div>
        <p className="text-xs text-ink-muted">
          Home coordinates + radius define your jurisdiction for open-shift matching.
        </p>

        <Button type="submit" disabled={save.isPending}>
          {!save.isPending ? <Save className="h-4 w-4" aria-hidden /> : null}
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <section className="space-y-3 rounded-lg border border-line bg-paper p-5">
        <h2 className="font-display text-xl text-ink">Published reviews</h2>
        {reviews.isLoading ? (
          <p className="text-sm text-ink-muted">Loading reviews…</p>
        ) : null}
        {(reviews.data ?? []).length === 0 ? (
          <p className="text-sm text-ink-muted">No published reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {(reviews.data ?? []).map((review) => (
              <li key={review.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => {
                    const filled = i < Number(review.rating);
                    return (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          filled ? "text-brand" : "text-ink-muted"
                        }`}
                        fill={filled ? "currentColor" : "none"}
                        aria-hidden
                      />
                    );
                  })}
                  <span className="ml-2 text-xs text-ink-muted">
                    {review.reviewerLabel}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-1 text-sm text-ink-muted">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
