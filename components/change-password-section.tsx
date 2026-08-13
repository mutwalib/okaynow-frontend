"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";
import { Field, PasswordInput } from "@/components/ui/field";
import { KeyRound } from "lucide-react";

export function ChangePasswordSection() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const save = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      showToast("Password updated", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <section className="space-y-4 rounded-lg border border-line bg-paper p-5">
      <div>
        <h2 className="inline-flex items-center gap-2 font-display text-xl text-ink">
          <KeyRound className="h-4 w-4 text-ink-muted" aria-hidden />
          Change password
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          After verification, password is the only account detail you can change.
        </p>
      </div>
      <form className="space-y-3" onSubmit={onSubmit}>
        <Field label="Current password">
          <PasswordInput
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field label="New password">
          <PasswordInput
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </section>
  );
}
