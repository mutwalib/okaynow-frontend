"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyCaregiverProfile, updateMyCaregiverProfile, uploadCaregiverPhoto, getMyPublishedReviews } from "@/lib/api";
import {
  QUALIFICATIONS,
  QUALIFICATION_LABELS,
  type Qualification,
} from "@/lib/types";
import { DEFAULT_STATE, maZipMessage } from "@/lib/service-region";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { Save, Star } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/shift-card";
import { ProfilePhotoField } from "@/components/profile-photo-field";
import { DeleteAccountSection } from "@/components/delete-account-section";
import { ChangePasswordSection } from "@/components/change-password-section";
import { useRouter } from "next/navigation";

type FormValues = {
  firstName: string;
  lastName: string;
  hourlyRateMin: number | "";
  hourlyRateMax: number | "";
  serviceRadiusMiles: number | "";
  homeAddressLine: string;
  homeCity: string;
  homeZip: string;
  qualifications: Qualification[];
};

export default function CaregiverProfilePage() {
  const { showToast } = useToast();
  const { user, refreshAccountStatus } = useAuth();
  const router = useRouter();
  const locked = user?.status === "ACTIVE";
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
      homeAddressLine: "",
      homeCity: "",
      homeZip: "",
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
      homeAddressLine: profile.data.homeAddressLine ?? "",
      homeCity: profile.data.homeCity ?? "",
      homeZip: profile.data.homeZip ?? "",
      qualifications: profile.data.qualifications ?? [],
    });
  }, [profile.data, reset]);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      if (values.homeZip && maZipMessage(values.homeZip) !== true) {
        return Promise.reject(new Error(String(maZipMessage(values.homeZip))));
      }
      if (!values.qualifications.length) {
        return Promise.reject(new Error("Select at least one qualification."));
      }
      return updateMyCaregiverProfile({
        firstName: profile.data!.firstName,
        lastName: profile.data!.lastName,
        qualifications: values.qualifications,
        hourlyRateMin:
          values.hourlyRateMin === "" ? null : Number(values.hourlyRateMin),
        hourlyRateMax:
          values.hourlyRateMax === "" ? null : Number(values.hourlyRateMax),
        serviceRadiusMiles:
          values.serviceRadiusMiles === ""
            ? null
            : Number(values.serviceRadiusMiles),
        homeAddressLine: values.homeAddressLine || null,
        homeCity: values.homeCity || null,
        homeState: DEFAULT_STATE,
        homeZip: values.homeZip || null,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["caregiver-me"] });
      if (locked) {
        const next = await refreshAccountStatus();
        if (next?.status === "PENDING_REVIEW") {
          showToast(
            "Profile updated. Your account is back under agency review.",
            "success",
          );
          router.replace("/pending-review");
          return;
        }
      }
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


  function needsAgencyReverification(values: FormValues) {
    if (!profile.data) return false;
    const currentQuals = [...(profile.data.qualifications ?? [])].sort();
    const nextQuals = [...values.qualifications].sort();
    const qualsChanged =
      currentQuals.length !== nextQuals.length ||
      currentQuals.some((q, i) => q !== nextQuals[i]);
    const addressChanged =
      (values.homeAddressLine || "") !== (profile.data.homeAddressLine ?? "") ||
      (values.homeCity || "") !== (profile.data.homeCity ?? "") ||
      (values.homeZip || "") !== (profile.data.homeZip ?? "");
    return qualsChanged || addressChanged;
  }

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
          {locked
            ? "You can update your details below. Changing qualifications or home address sends your account back for agency verification. Pay rate and service radius do not."
            : "Set your qualifications, pay range, and service area before the agency finishes review."}
        </p>
      </div>

      <form
        className="space-y-5 rounded-lg border border-line bg-paper p-5"
        onSubmit={handleSubmit((v) => {
          if (locked && needsAgencyReverification(v)) {
            if (
              !window.confirm(
                "Saving changes to qualifications or home address sends your account back for agency verification. You will not have full access until approved again. Continue?",
              )
            ) {
              return;
            }
          }
          save.mutate(v);
        })}
      >
        <ProfilePhotoField
          photoUrl={profile.data?.profilePhotoUrl}
          name={`${profile.data?.firstName ?? ""} ${profile.data?.lastName ?? ""}`}
          uploading={photo.isPending}
          disabled={locked}
          onUpload={(file) => {
            if (!locked) photo.mutate(file);
          }}
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
            <Input
              readOnly
              disabled
              value={profile.data?.firstName ?? ""}
              title="Legal name is locked after registration"
            />
          </Field>
          <Field label="Last name">
            <Input
              readOnly
              disabled
              value={profile.data?.lastName ?? ""}
              title="Legal name is locked after registration"
            />
          </Field>
        </div>
        <p className="text-xs text-ink-muted">
          Names are set at registration and cannot be changed here. Contact the
          agency if a correction is required — staff can update it for you.
        </p>
        {locked ? (
          <p className="text-xs text-ink-muted">
            Changing qualifications or home address requires agency
            re-verification before you can continue. Pay rate and radius do not.
          </p>
        ) : null}

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Qualifications</p>
          <div className="flex flex-wrap gap-2">
            {QUALIFICATIONS.map((q) => {
              const on = selected.includes(q);
              return (
                <button
                  key={q}
                  type="button"
                  disabled={save.isPending}
                  onClick={() => toggleQual(q)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                    on
                      ? "border-brand bg-brand-soft text-brand-deep"
                      : "border-line bg-paper text-ink-muted hover:border-brand"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {QUALIFICATION_LABELS[q]}
                </button>
              );
            })}
          </div>
          {locked ? (
            <p className="mt-2 text-xs text-ink-muted">
              You can add or remove qualifications here. Saving qualification or
              address changes sends your account back for agency review.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Min $/hr">
            <Input
              type="number"
              step="0.01"
              {...register("hourlyRateMin")}
            />
          </Field>
          <Field label="Max $/hr">
            <Input
              type="number"
              step="0.01"
              {...register("hourlyRateMax")}
            />
          </Field>
          <Field label="Radius (mi)">
            <Input
              type="number"
              {...register("serviceRadiusMiles")}
            />
          </Field>
        </div>

        <Field label="Street address">
          <Input {...register("homeAddressLine")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <Input {...register("homeCity")} />
          </Field>
          <Field label="ZIP">
            <Input {...register("homeZip")} />
          </Field>
        </div>
        <p className="text-xs text-ink-muted">
          Home address is located automatically for open-shift distance matching
          (Massachusetts).
        </p>

        <Button type="submit" disabled={save.isPending}>
          {!save.isPending ? <Save className="h-4 w-4" aria-hidden /> : null}
          {save.isPending
            ? "Saving…"
            : locked
              ? "Save profile"
              : "Save profile"}
        </Button>
      </form>

      <ChangePasswordSection />

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

      <DeleteAccountSection roleHint="Any open or upcoming claimed shifts will be released." />
    </div>
  );
}
