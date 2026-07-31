"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, createCaregiverReview, getReviewForShift } from "@/lib/api";
import type { CaregiverReview } from "@/lib/types";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Star } from "lucide-react";

export function CaregiverReviewPanel({ shiftId }: { shiftId: string }) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const existing = useQuery({
    queryKey: ["review-shift", shiftId],
    queryFn: async () => {
      try {
        return await getReviewForShift(shiftId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });

  const submit = useMutation({
    mutationFn: () =>
      createCaregiverReview({
        shiftId,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (data) => {
      qc.setQueryData(["review-shift", shiftId], data);
      showToast("Thanks — your review was submitted for admin approval", "success");
    },
    onError: (err: Error) => showToast(err.message, "error"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit.mutate();
  }

  if (existing.isLoading) {
    return <p className="text-sm text-ink-muted">Checking review status…</p>;
  }

  if (existing.data) {
    return <ReviewSummary review={existing.data} />;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-line bg-paper p-4"
    >
      <div>
        <h2 className="font-display text-xl text-ink">Rate your caregiver</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Reviews appear on the caregiver profile only after an admin publishes
          them.
        </p>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = value <= rating;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded p-1 text-brand transition hover:scale-105"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={filled}
            >
              <Star
                className={`h-6 w-6 ${filled ? "text-brand" : "text-ink-muted"}`}
                fill={filled ? "currentColor" : "none"}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      <Field label="Comments (optional)">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Punctuality, professionalism, care quality…"
          maxLength={2000}
        />
      </Field>
      <Button type="submit" disabled={submit.isPending}>
        {submit.isPending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}

function ReviewSummary({ review }: { review: CaregiverReview }) {
  const statusLabel =
    review.status === "PUBLISHED"
      ? "Published on caregiver profile"
      : review.status === "HIDDEN"
        ? "Hidden by admin"
        : "Pending admin approval";
  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <h2 className="font-display text-xl text-ink">Your review</h2>
      <div className="mt-2 flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < Number(review.rating);
          return (
            <Star
              key={i}
              className={`h-4 w-4 ${filled ? "text-brand" : "text-ink-muted"}`}
              fill={filled ? "currentColor" : "none"}
              aria-hidden
            />
          );
        })}
        <span className="ml-2 text-xs text-ink-muted">{statusLabel}</span>
      </div>
      {review.comment ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
          {review.comment}
        </p>
      ) : null}
    </div>
  );
}
