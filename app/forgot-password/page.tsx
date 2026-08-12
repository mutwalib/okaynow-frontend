"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { formatAuthError } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { forgotPassword, resetPassword } from "@/lib/api";
import { BrandLogo } from "@/components/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      showToast(res.message, "success");
      setStep("reset");
    } catch (err) {
      showToast(formatAuthError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Passwords don’t match", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await resetPassword(email.trim(), code.trim(), newPassword);
      showToast(res.message, "success");
      window.location.assign("/login");
    } catch (err) {
      showToast(formatAuthError(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen atmosphere">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="inline-block">
          <BrandLogo variant="primary" priority height={40} />
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ink">Reset password</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {step === "request"
            ? "We’ll email a one-time code if an account exists for that address."
            : "Enter the code from your email and choose a new password."}
        </p>

        {step === "request" ? (
          <form onSubmit={onRequest} className="mt-8 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Sending…" : "Send reset code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onReset} className="mt-8 space-y-4">
            <Field label="Email">
              <Input type="email" required value={email} readOnly />
            </Field>
            <Field label="Reset code">
              <Input
                inputMode="numeric"
                required
                minLength={6}
                maxLength={12}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
              />
            </Field>
            <Field label="New password">
              <PasswordInput
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field
              label="Confirm password"
              error={
                confirmPassword.length > 0 && newPassword !== confirmPassword
                  ? "Passwords don’t match"
                  : undefined
              }
            >
              <PasswordInput
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}

        <ButtonLink href="/login" variant="ghost" className="mt-4 self-start px-0">
          Back to sign in
        </ButtonLink>
      </div>
    </div>
  );
}
