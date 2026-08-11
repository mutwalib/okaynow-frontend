"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { formatAuthError, useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { resendVerification } from "@/lib/api";
import { ROLE_HOME } from "@/lib/types";
import { BrandLogo } from "@/components/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function VerifyEmailForm() {
  const { completeEmailVerification, isAuthenticated, user, isLoading } =
    useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [isAuthenticated, isLoading, router, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await completeEmailVerification(email.trim(), code.trim());
      showToast("Email verified — welcome", "success");
      router.push(ROLE_HOME[u.role]);
    } catch (err) {
      showToast(formatAuthError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    if (!email.trim()) {
      showToast("Enter your email first", "error");
      return;
    }
    setResending(true);
    try {
      const res = await resendVerification(email.trim());
      showToast(res.message, "success");
    } catch (err) {
      showToast(formatAuthError(err), "error");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex min-h-screen atmosphere">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="inline-block">
          <BrandLogo variant="primary" priority height={40} />
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ink">Verify email</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Enter the 6-digit code we sent to your inbox to activate your account.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Verification code">
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={6}
              maxLength={12}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              placeholder="6-digit code"
            />
          </Field>
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify and continue"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => void onResend()}
          disabled={resending}
          className="mt-4 text-sm font-medium text-brand-deep hover:underline disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend code"}
        </button>
        <ButtonLink href="/login" variant="ghost" className="mt-4 self-start px-0">
          Back to sign in
        </ButtonLink>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center atmosphere">
          Loading…
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
