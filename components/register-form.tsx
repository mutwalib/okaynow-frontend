"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatAuthError, useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { getCurrentLegalDocuments } from "@/lib/api";
import {
  CARE_RECIPIENT_RELATIONSHIP_LABEL,
  MEDICAID_ELIGIBILITY_LABEL,
  ROLE_LABEL,
  homePathForUser,
  type CareRecipientRelationship,
  type MedicaidEligibility,
  type UserRole,
} from "@/lib/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, PasswordInput, Select } from "@/components/ui/field";
import {
  DEFAULT_STATE,
  SERVICE_REGION_LABEL,
  maZipMessage,
} from "@/lib/service-region";

const ROLES: UserRole[] = ["CAREGIVER", "CLIENT", "FACILITY", "AGENCY_ADMIN"];

export function RegisterForm({ lockedRole }: { lockedRole?: UserRole }) {
  const { register, isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();

  const initialRole = useMemo(() => {
    if (lockedRole && ROLES.includes(lockedRole)) {
      return lockedRole;
    }
    const r = params.get("role")?.toUpperCase();
    return ROLES.includes(r as UserRole) ? (r as UserRole) : "CAREGIVER";
  }, [lockedRole, params]);

  const [role, setRole] = useState<UserRole>(initialRole);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registeringForSelf, setRegisteringForSelf] = useState("true");
  const [medicaidEligible, setMedicaidEligible] = useState<"" | MedicaidEligibility>("");
  const [relationshipToCareRecipient, setRelationshipToCareRecipient] = useState<
    "" | CareRecipientRelationship
  >("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const legalDocs = useQuery({
    queryKey: ["legal-current"],
    queryFn: getCurrentLegalDocuments,
  });

  const forSomeoneElse = role === "CLIENT" && registeringForSelf === "false";

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(homePathForUser(user));
    }
  }, [isAuthenticated, isLoading, router, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (role === "CLIENT" && forSomeoneElse) {
      if (!medicaidEligible || !relationshipToCareRecipient) {
        showToast(
          "Select Medicaid eligibility and your relationship to the person receiving care",
          "error",
        );
        return;
      }
    }
    if (role === "FACILITY") {
      if (!facilityName.trim() || !addressLine.trim() || !city.trim() || !zip.trim()) {
        showToast("Facility name and full address are required", "error");
        return;
      }
      const zipCheck = maZipMessage(zip);
      if (zipCheck !== true) {
        showToast(zipCheck, "error");
        return;
      }
    }
    if (role === "AGENCY_ADMIN") {
      if (!agencyName.trim() || !addressLine.trim() || !city.trim() || !zip.trim()) {
        showToast("Agency name and full business address are required", "error");
        return;
      }
      const zipCheck = maZipMessage(zip);
      if (zipCheck !== true) {
        showToast(zipCheck, "error");
        return;
      }
    }
    if (!acceptedLegal) {
      showToast("Accept the Terms, Privacy Policy, and Platform Policy to continue", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords don’t match", "error");
      return;
    }
    const docIds = (legalDocs.data ?? []).map((d) => d.id);
    if (docIds.length === 0) {
      showToast("Legal documents are not available yet — try again shortly", "error");
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({
        email,
        password,
        phone: phone || undefined,
        role,
        firstName,
        lastName,
        acceptedLegalDocumentIds: docIds,
        ...(role === "CLIENT"
          ? {
              registeringForSelf: registeringForSelf === "true",
              ...(forSomeoneElse
                ? {
                    medicaidEligible: medicaidEligible as MedicaidEligibility,
                    relationshipToCareRecipient:
                      relationshipToCareRecipient as CareRecipientRelationship,
                  }
                : {}),
            }
          : {}),
        ...(role === "FACILITY"
          ? {
              facilityName: facilityName.trim(),
              addressLine: addressLine.trim(),
              city: city.trim(),
              state: DEFAULT_STATE,
              zip: zip.trim(),
            }
          : {}),
        ...(role === "AGENCY_ADMIN"
          ? {
              agencyName: agencyName.trim(),
              addressLine: addressLine.trim(),
              city: city.trim(),
              state: DEFAULT_STATE,
              zip: zip.trim(),
            }
          : {}),
      });
      showToast(result.message || "Check your email for a verification code", "success");
      router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
    } catch (err) {
      showToast(formatAuthError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen atmosphere">
      <div className="mx-auto flex w-full max-w-lg flex-col justify-center px-6 py-12">
        <Link href="/" className="inline-block animate-rise">
          <BrandLogo variant="primary" priority height={40} />
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ink animate-rise-delay">
          {lockedRole === "AGENCY_ADMIN"
            ? "Create your agency account"
            : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-ink-muted animate-rise-delay">
          {lockedRole === "AGENCY_ADMIN"
            ? "Subscribe, list in the home directory, and run roster, scheduling, and billing."
            : "Choose your role — each has its own workspace."}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 animate-rise-delay-2">
          {lockedRole ? null : (
          <Field label="I am a…">
            <Select
              value={role}
              onChange={(e) => {
                const next = e.target.value as UserRole;
                setRole(next);
                if (next !== "CLIENT") {
                  setRegisteringForSelf("true");
                  setMedicaidEligible("");
                  setRelationshipToCareRecipient("");
                }
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          )}

          {role === "FACILITY" ? (
            <Field label="Facility name">
              <Input
                required
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="Sunrise Adult Day Health"
              />
            </Field>
          ) : null}

          {role === "AGENCY_ADMIN" ? (
            <Field label="Agency name">
              <Input
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Harbor Home Care LLC"
              />
            </Field>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={
                role === "FACILITY"
                  ? "Contact first name"
                  : role === "AGENCY_ADMIN"
                    ? "Admin first name"
                    : "First name"
              }
            >
              <Input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Field>
            <Field
              label={
                role === "FACILITY"
                  ? "Contact last name"
                  : role === "AGENCY_ADMIN"
                    ? "Admin last name"
                    : "Last name"
              }
            >
              <Input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Field>
          </div>

          {role === "FACILITY" || role === "AGENCY_ADMIN" ? (
            <>
              <Field label={role === "AGENCY_ADMIN" ? "Business address" : "Facility address"}>
                <Input
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="123 Main St"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City">
                  <Input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </Field>
                <Field label="State">
                  <Input
                    readOnly
                    required
                    value={DEFAULT_STATE}
                    title={`OkayNow currently operates in ${SERVICE_REGION_LABEL} only`}
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
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                  />
                </Field>
              </div>
            </>
          ) : null}

          {role === "CLIENT" ? (
            <>
              <Field label="Who is this account for?">
                <Select
                  required
                  value={registeringForSelf}
                  onChange={(e) => {
                    setRegisteringForSelf(e.target.value);
                    if (e.target.value === "true") {
                      setMedicaidEligible("");
                      setRelationshipToCareRecipient("");
                    }
                  }}
                >
                  <option value="true">Myself (I am receiving care)</option>
                  <option value="false">Someone else (I am registering for them)</option>
                </Select>
              </Field>

              {forSomeoneElse ? (
                <>
                  <Field label="Is the person receiving care eligible for Medicaid?">
                    <Select
                      required
                      value={medicaidEligible}
                      onChange={(e) =>
                        setMedicaidEligible(e.target.value as MedicaidEligibility | "")
                      }
                    >
                      <option value="">Choose one…</option>
                      {(
                        Object.keys(MEDICAID_ELIGIBILITY_LABEL) as MedicaidEligibility[]
                      ).map((value) => (
                        <option key={value} value={value}>
                          {MEDICAID_ELIGIBILITY_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="What is your relationship to the person receiving care? I am the:">
                    <Select
                      required
                      value={relationshipToCareRecipient}
                      onChange={(e) =>
                        setRelationshipToCareRecipient(
                          e.target.value as CareRecipientRelationship | "",
                        )
                      }
                    >
                      <option value="">Choose one…</option>
                      {(
                        Object.keys(
                          CARE_RECIPIENT_RELATIONSHIP_LABEL,
                        ) as CareRecipientRelationship[]
                      ).map((value) => (
                        <option key={value} value={value}>
                          {CARE_RECIPIENT_RELATIONSHIP_LABEL[value]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              ) : null}
            </>
          ) : null}

          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Phone (optional)">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field
            label="Confirm password"
            error={
              confirmPassword.length > 0 && password !== confirmPassword
                ? "Passwords don’t match"
                : undefined
            }
          >
            <PasswordInput
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>

          <label className="flex items-start gap-2 rounded-lg border border-line bg-paper px-3 py-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
            />
            <span>
              I agree to the{" "}
              {(legalDocs.data ?? []).map((d, i) => (
                <span key={d.id}>
                  {i > 0 ? ", " : ""}
                  <Link
                    href={`/legal/${d.documentType.toLowerCase().replaceAll("_", "-")}`}
                    className="font-medium text-brand-deep underline"
                    target="_blank"
                  >
                    {d.title}
                  </Link>
                  <span className="text-ink-muted"> (v{d.version})</span>
                </span>
              ))}
            </span>
          </label>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {!submitting ? <ArrowRight className="h-5 w-5" aria-hidden /> : null}
            {submitting ? "Creating…" : `Continue as ${ROLE_LABEL[role]}`}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-deep underline">
            Sign in
          </Link>
        </p>
        <ButtonLink href="/" variant="ghost" className="mt-4 self-start px-0">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}

export default function RegisterFormPage({
  lockedRole,
}: {
  lockedRole?: UserRole;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center atmosphere">
          Loading…
        </div>
      }
    >
      <RegisterForm lockedRole={lockedRole} />
    </Suspense>
  );
}
