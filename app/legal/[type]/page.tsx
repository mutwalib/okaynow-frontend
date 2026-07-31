"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCurrentLegalDocuments } from "@/lib/api";

const TYPE_SLUG: Record<string, string> = {
  "terms-of-service": "TERMS_OF_SERVICE",
  "privacy-policy": "PRIVACY_POLICY",
  "platform-policy": "PLATFORM_POLICY",
};

export default function LegalDocPage({
  params,
}: {
  params: { type: string };
}) {
  const docs = useQuery({
    queryKey: ["legal-current"],
    queryFn: getCurrentLegalDocuments,
  });
  const wanted = TYPE_SLUG[params.type] ?? params.type.toUpperCase();
  const doc = (docs.data ?? []).find((d) => d.documentType === wanted);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-brand-deep underline">
        OkayNow
      </Link>
      {docs.isLoading ? (
        <p className="mt-6 text-ink-muted">Loading…</p>
      ) : !doc ? (
        <p className="mt-6 text-danger">Document not found.</p>
      ) : (
        <article className="mt-6 space-y-4">
          <h1 className="font-display text-3xl text-ink">{doc.title}</h1>
          <p className="text-xs text-ink-muted">Version {doc.version}</p>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {doc.body}
          </div>
        </article>
      )}
    </div>
  );
}
