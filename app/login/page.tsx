"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { formatAuthError, useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { homePathForUser } from "@/lib/types";
import { ArrowLeft, LogIn } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/field";

function LoginForm() {
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const next = params.get("next");
      router.replace(
        user.status === "PENDING_REVIEW"
          ? "/pending-review"
          : next || homePathForUser(user),
      );
    }
  }, [isAuthenticated, isLoading, params, router, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login({ email, password });
      showToast("Welcome back", "success");
      const next = params.get("next");
      router.push(
        u.status === "PENDING_REVIEW"
          ? "/pending-review"
          : next || homePathForUser(u),
      );
    } catch (err) {
      const msg = formatAuthError(err);
      showToast(msg, "error");
      if (msg.toLowerCase().includes("email not verified")) {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen atmosphere">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="inline-block animate-rise">
          <BrandLogo variant="primary" priority height={40} />
        </Link>
        <h1 className="mt-6 font-display text-3xl text-ink animate-rise-delay">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-ink-muted animate-rise-delay">
          Sign in as a caregiver, family/client, or facility.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 animate-rise-delay-2">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <p className="text-right text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-brand-deep underline"
            >
              Forgot password?
            </Link>
          </p>
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {!submitting ? <LogIn className="h-5 w-5" aria-hidden /> : null}
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">
          New here?{" "}
          <Link
            href={
              params.get("next")
                ? `/register?next=${encodeURIComponent(params.get("next")!)}`
                : "/register"
            }
            className="font-medium text-brand-deep underline"
          >
            Create an account
          </Link>
          {" · "}
          <Link
            href="/verify-email"
            className="font-medium text-brand-deep underline"
          >
            Verify email
          </Link>
        </p>
        <a
          href={
            process.env.NEXT_PUBLIC_ADMIN_APP_URL ??
            "http://localhost:3001/login"
          }
          className="mt-3 text-sm font-medium text-brand-deep hover:underline"
        >
          Platform owner? Open the owner console →
        </a>
        <ButtonLink href="/" variant="ghost" className="mt-4 self-start px-0">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center atmosphere">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
