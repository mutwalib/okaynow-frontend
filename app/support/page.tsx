import type { Metadata } from "next";
import Link from "next/link";
import { MarketingDocShell } from "@/components/marketing-doc-shell";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with the OkayNow caregiver and home care staffing app in Massachusetts.",
};

export default function SupportPage() {
  return (
    <MarketingDocShell title="Support" updated="August 12, 2026">
      <p>
        OkayNow helps caregivers, families, and facilities coordinate home care
        and adult care shifts in Massachusetts. Use the channels below if you
        need help with your account, scheduling, or the mobile app.
      </p>

      <h2>Contact</h2>
      <ul>
        <li>
          Email:{" "}
          <a
            className="font-medium text-brand-deep underline-offset-2 hover:underline"
            href="mailto:mutwalibb@gmail.com"
          >
            mutwalibb@gmail.com
          </a>
        </li>
        <li>We typically respond within one business day.</li>
      </ul>

      <h2>Caregiver mobile app</h2>
      <ul>
        <li>Sign in with the email you used to register as a caregiver.</li>
        <li>
          For password resets, use <Link href="/forgot-password">Forgot password</Link>{" "}
          on the web app, then return to the mobile app.
        </li>
        <li>
          Open shifts only appear when your profile includes matching
          qualifications and your agency has released shifts to the marketplace.
        </li>
      </ul>

      <h2>Accounts &amp; access</h2>
      <ul>
        <li>
          Families and facilities use the web app at{" "}
          <Link href="/">okaynowcare.com</Link>.
        </li>
        <li>
          Agency admins use the owner console (separate login). Contact us if
          you need admin access provisioned.
        </li>
      </ul>

      <h2>Policies</h2>
      <ul>
        <li>
          <Link href="/privacy">Privacy Policy</Link>
        </li>
        <li>
          <Link href="/terms">Terms of Service</Link>
        </li>
      </ul>
    </MarketingDocShell>
  );
}
