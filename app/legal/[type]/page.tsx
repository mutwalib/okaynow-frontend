"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BrandLogo } from "@/components/brand-logo";
import { getCurrentLegalDocuments } from "@/lib/api";

const TYPE_SLUG: Record<string, string> = {
  "terms-of-service": "TERMS_OF_SERVICE",
  "privacy-policy": "PRIVACY_POLICY",
  "platform-policy": "PLATFORM_POLICY",
};

export default function LegalDocPage() {
  const routeParams = useParams<{ type?: string | string[] }>();
  const slug = Array.isArray(routeParams.type)
    ? routeParams.type[0]
    : routeParams.type;

  const docs = useQuery({
    queryKey: ["legal-current"],
    queryFn: getCurrentLegalDocuments,
  });

  const wanted = slug
    ? (TYPE_SLUG[slug] ?? slug.toUpperCase().replace(/-/g, "_"))
    : null;
  const doc = wanted
    ? (docs.data ?? []).find((d) => d.documentType === wanted)
    : undefined;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="inline-block">
        <BrandLogo variant="primary" height={32} />
      </Link>
      {!slug ? (
        <p className="mt-6 text-danger">Invalid document link.</p>
      ) : docs.isLoading ? (
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
