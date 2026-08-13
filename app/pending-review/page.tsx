"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyCaregiverProfile,
  getMyClientProfile,
  getOnboardingStatus,
  submitOnboardingFile,
  submitOnboardingText,
  updateMyCaregiverProfile,
  updateMyClientProfile,
  type OnboardingRequestItem,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  QUALIFICATIONS,
  homePathForUser,
  type CaregiverProfile,
  type ClientProfile,
  type Qualification,
} from "@/lib/types";
import { DEFAULT_STATE, maZipMessage } from "@/lib/service-region";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/lib/toast-context";
import { CheckCircle2, LogOut, Upload } from "lucide-react";

function RequestCard({
  item,
  onDone,
}: {
  item: OnboardingRequestItem;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [text, setText] = useState(item.responseText ?? "");
  const open = item.status === "OPEN" || item.status === "SUBMITTED";

  const textMut = useMutation({
    mutationFn: () => submitOnboardingText(item.id, text),
    onSuccess: () => {
      showToast("Submitted — thank you", "success");
      onDone();
    },
    onError: (e: Error) => showToast(e.message, "error"),
  });

  const fileMut = useMutation({
    mutationFn: (file: File) => submitOnboardingFile(item.id, file),
    onSuccess: () => {
      showToast("File uploaded — thank you", "success");
      onDone();
    },
    onError: (e: Error) => showToast(e.message, "error"),
  });

  return (
    <div className="rounded-lg border border-line bg-paper p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-ink">{item.title}</h3>
          {item.instructions ? (
            <p className="mt-1 text-sm text-ink-muted">{item.instructions}</p>
          ) : null}
        </div>
        <span className="rounded bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-deep">
          {item.status}
        </span>
      </div>

      {!open ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-muted">
          <CheckCircle2 className="h-4 w-4 text-brand" aria-hidden />
          {item.status === "ACCEPTED" ? "Accepted by the agency" : "Closed"}
        </p>
      ) : item.fieldType === "TEXT" ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            textMut.mutate();
          }}
        >
          <Field label="Your response">
            <Textarea
              rows={4}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={textMut.isPending}>
            {textMut.isPending ? "Submitting…" : "Submit"}
          </Button>
        </form>
      ) : (
        <div className="mt-4 space-y-2">
          <Field label={item.fieldType === "PROFILE_PHOTO" ? "Photo" : "Document"}>
            <Input
              type="file"
              accept={
                item.fieldType === "PROFILE_PHOTO"
                  ? "image/jpeg,image/png,image/webp"
                  : "image/jpeg,image/png,image/webp,application/pdf"
              }
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) fileMut.mutate(file);
              }}
              disabled={fileMut.isPending}
            />
          </Field>
          <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <Upload className="h-3.5 w-3.5" aria-hidden />
            {fileMut.isPending ? "Uploading…" : "Choose a file to upload"}
          </p>
        </div>
      )}
    </div>
  );
}

function CaregiverApplicationForm({ onSaved }: { onSaved: () => void }) {
  const profile = useQuery({
    queryKey: ["caregiver-me"],
    queryFn: getMyCaregiverProfile,
  });
  if (!profile.data) return null;
  return (
    <CaregiverApplicationFields
      key={profile.data.id}
      profile={profile.data}
      onSaved={onSaved}
    />
  );
}

function CaregiverApplicationFields({
  profile,
  onSaved,
}: {
  profile: CaregiverProfile;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [quals, setQuals] = useState<Qualification[]>(
    () => profile.qualifications ?? [],
  );
  const [rateMin, setRateMin] = useState(() =>
    profile.hourlyRateMin != null ? String(profile.hourlyRateMin) : "",
  );
  const [rateMax, setRateMax] = useState(() =>
    profile.hourlyRateMax != null ? String(profile.hourlyRateMax) : "",
  );
  const [radius, setRadius] = useState(() =>
    profile.serviceRadiusMiles != null ? String(profile.serviceRadiusMiles) : "",
  );
  const [addressLine, setAddressLine] = useState(
    () => profile.homeAddressLine ?? "",
  );
  const [city, setCity] = useState(() => profile.homeCity ?? "");
  const [zip, setZip] = useState(() => profile.homeZip ?? "");

  const save = useMutation({
    mutationFn: () => {
      if (zip && maZipMessage(zip) !== true) {
        throw new Error(String(maZipMessage(zip)));
      }
      return updateMyCaregiverProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        qualifications: quals,
        hourlyRateMin: rateMin === "" ? null : Number(rateMin),
        hourlyRateMax: rateMax === "" ? null : Number(rateMax),
        serviceRadiusMiles: radius === "" ? null : Number(radius),
        homeAddressLine: addressLine || null,
        homeCity: city || null,
        homeState: DEFAULT_STATE,
        homeZip: zip || null,
      });
    },
    onSuccess: () => {
      showToast("Application details saved", "success");
      onSaved();
    },
    onError: (e: Error) => showToast(e.message, "error"),
  });

  return (
    <form
      className="space-y-4 rounded-lg border border-line bg-paper p-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div>
        <h2 className="font-display text-xl text-ink">Application details</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Add qualifications and your home address so we can match nearby shifts.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUALIFICATIONS.map((q) => {
          const on = quals.includes(q);
          return (
            <button
              key={q}
              type="button"
              onClick={() =>
                setQuals((prev) =>
                  on ? prev.filter((x) => x !== q) : [...prev, q],
                )
              }
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                on
                  ? "border-brand bg-brand-soft text-brand-deep"
                  : "border-line text-ink-muted"
              }`}
            >
              {q}
            </button>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Min $/hr">
          <Input value={rateMin} onChange={(e) => setRateMin(e.target.value)} />
        </Field>
        <Field label="Max $/hr">
          <Input value={rateMax} onChange={(e) => setRateMax(e.target.value)} />
        </Field>
        <Field label="Radius (mi)">
          <Input value={radius} onChange={(e) => setRadius(e.target.value)} />
        </Field>
      </div>
      <Field label="Street address">
        <Input
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          required
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City">
          <Input value={city} onChange={(e) => setCity(e.target.value)} required />
        </Field>
        <Field label="ZIP">
          <Input value={zip} onChange={(e) => setZip(e.target.value)} required />
        </Field>
      </div>
      <p className="text-xs text-ink-muted">
        We locate your address automatically for shift-distance matching. State is
        Massachusetts.
      </p>
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}

function ClientApplicationForm({ onSaved }: { onSaved: () => void }) {
  const profile = useQuery({
    queryKey: ["client-me"],
    queryFn: getMyClientProfile,
  });
  if (!profile.data) return null;
  return (
    <ClientApplicationFields
      key={profile.data.id}
      profile={profile.data}
      onSaved={onSaved}
    />
  );
}

function ClientApplicationFields({
  profile,
  onSaved,
}: {
  profile: ClientProfile;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [addressLine, setAddressLine] = useState(
    () => profile.addressLine ?? "",
  );
  const [city, setCity] = useState(() => profile.city ?? "");
  const [zip, setZip] = useState(() => profile.zip ?? "");
  const [careNeeds, setCareNeeds] = useState(() => profile.careNeeds ?? "");

  const save = useMutation({
    mutationFn: () => {
      if (zip && maZipMessage(zip) !== true) {
        throw new Error(String(maZipMessage(zip)));
      }
      return updateMyClientProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        state: DEFAULT_STATE,
        addressLine: addressLine || null,
        city: city || null,
        zip: zip || null,
        careNeeds: careNeeds || null,
      });
    },
    onSuccess: () => {
      showToast("Application details saved", "success");
      onSaved();
    },
    onError: (e: Error) => showToast(e.message, "error"),
  });

  return (
    <form
      className="space-y-4 rounded-lg border border-line bg-paper p-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div>
        <h2 className="font-display text-xl text-ink">Care address</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Confirm the service address while your application is under review.
        </p>
      </div>
      <Field label="Street address">
        <Input
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          required
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City">
          <Input value={city} onChange={(e) => setCity(e.target.value)} required />
        </Field>
        <Field label="ZIP">
          <Input value={zip} onChange={(e) => setZip(e.target.value)} required />
        </Field>
      </div>
      <Field label="Care needs">
        <Textarea
          rows={3}
          value={careNeeds}
          onChange={(e) => setCareNeeds(e.target.value)}
        />
      </Field>
      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}

export default function PendingReviewPage() {
  const { user, isLoading, isAuthenticated, logout, setAccountStatus } =
    useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const status = useQuery({
    queryKey: ["onboarding-me"],
    queryFn: getOnboardingStatus,
    enabled: isAuthenticated,
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "CAREGIVER" && user.role !== "CLIENT") {
      router.replace(homePathForUser(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    if (!status.data || !user) return;
    setAccountStatus(status.data.userStatus);
    if (!status.data.pendingReview) {
      router.replace(
        homePathForUser({
          role: user.role,
          status: status.data.userStatus,
        }),
      );
    }
  }, [router, setAccountStatus, status.data, user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center atmosphere text-ink-muted">
        Loading…
      </div>
    );
  }

  const applicationComplete = status.data?.applicationComplete === true;
  const openOrSubmitted =
    status.data?.requests.filter(
      (r) => r.status === "OPEN" || r.status === "SUBMITTED",
    ) ?? [];
  const refreshOnboarding = () => {
    void qc.invalidateQueries({ queryKey: ["onboarding-me"] });
    void qc.invalidateQueries({ queryKey: ["caregiver-me"] });
    void qc.invalidateQueries({ queryKey: ["client-me"] });
  };

  return (
    <div className="min-h-screen atmosphere">
      <div className="mx-auto max-w-xl px-6 py-12">
        <BrandLogo variant="primary" height={36} />
        <h1 className="mt-8 font-display text-3xl text-ink">
          {applicationComplete
            ? "Thanks for registering"
            : "Complete your application"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {status.data?.message ??
            "Finish the steps below to complete your OkayNow application."}
        </p>

        {!applicationComplete && (status.data?.applicationMissing?.length ?? 0) > 0 ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink">
            {status.data!.applicationMissing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 space-y-4">
          {!applicationComplete && user.role === "CAREGIVER" ? (
            <CaregiverApplicationForm onSaved={refreshOnboarding} />
          ) : null}
          {!applicationComplete && user.role === "CLIENT" ? (
            <ClientApplicationForm onSaved={refreshOnboarding} />
          ) : null}

          {status.isLoading ? (
            <p className="text-sm text-ink-muted">Loading requests…</p>
          ) : null}

          {applicationComplete && openOrSubmitted.length === 0 && !status.isLoading ? (
            <div className="rounded-lg border border-dashed border-line bg-paper/70 p-5 text-sm text-ink-muted">
              No additional information is requested right now. We&apos;ll email
              you when your account is approved.
            </div>
          ) : null}

          {openOrSubmitted.map((item) => (
            <RequestCard
              key={item.id}
              item={item}
              onDone={refreshOnboarding}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          className="mt-10 px-0"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </div>
  );
}
