import type { Metadata } from "next";
import Link from "next/link";
import { MarketingDocShell } from "@/components/marketing-doc-shell";

export const metadata: Metadata = {
  title: "Account Deletion",
  description:
    "How to delete your OkayNow caregiver, family, or facility account.",
};

export default function AccountDeletionPage() {
  return (
    <MarketingDocShell title="Account deletion" updated="August 12, 2026">
      <p>
        OkayNow lets you delete your account from inside the product. Deletion
        disables sign-in, removes your profile from the marketplace, and frees
        your email for a future registration. Visit, scheduling, and billing
        records may be retained as required by law or legitimate agency
        operations.
      </p>

      <h2>In the caregiver mobile app</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Sign in to OkayNow.</li>
        <li>Open the <strong>Profile</strong> tab.</li>
        <li>Scroll to <strong>Delete account</strong> and confirm twice.</li>
      </ol>

      <h2>On the web</h2>
      <ul>
        <li>
          Caregivers:{" "}
          <Link href="/caregiver/profile">okaynowcare.com/caregiver/profile</Link>
        </li>
        <li>
          Families / clients:{" "}
          <Link href="/client/profile">okaynowcare.com/client/profile</Link>
        </li>
        <li>
          Facilities:{" "}
          <Link href="/facility/profile">okaynowcare.com/facility/profile</Link>
        </li>
      </ul>
      <p>
        Sign in, open Profile, then choose <strong>Delete account</strong> and
        confirm.
      </p>

      <h2>What happens when you delete</h2>
      <ul>
        <li>You can no longer sign in with that account.</li>
        <li>Your marketplace profile and credentials are removed or scrubbed.</li>
        <li>
          Caregivers: open or upcoming claimed shifts are released (you cannot
          delete while a shift is in progress—clock out or contact the agency
          first).
        </li>
        <li>
          Some historical records may be kept for payroll, compliance, or legal
          requirements.
        </li>
      </ul>

      <h2>Need help?</h2>
      <p>
        If you cannot access the app, email{" "}
        <a
          className="font-medium text-brand-deep underline-offset-2 hover:underline"
          href="mailto:mutwalibb@gmail.com"
        >
          mutwalibb@gmail.com
        </a>{" "}
        from the address on your account and request deletion. See also{" "}
        <Link href="/support">Support</Link> and our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </MarketingDocShell>
  );
}
