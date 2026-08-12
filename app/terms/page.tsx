import type { Metadata } from "next";
import Link from "next/link";
import { MarketingDocShell } from "@/components/marketing-doc-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for OkayNow Massachusetts home care staffing platform.",
};

export default function TermsPage() {
  return (
    <MarketingDocShell title="Terms of Service" updated="August 12, 2026">
      <p>
        These Terms of Service (“Terms”) govern your use of OkayNow websites and
        applications. By creating an account or using OkayNow, you agree to these
        Terms.
      </p>

      <h2>1. Platform role</h2>
      <p>
        OkayNow connects caregivers with families and facilities for home care
        and adult care shifts in Massachusetts. Caregivers are engaged as W-2
        employees of the staffing agency operating OkayNow unless otherwise
        stated in writing. OkayNow is a scheduling and operations platform; it is
        not a substitute for professional clinical judgment or emergency
        services.
      </p>

      <h2>2. Eligibility &amp; accounts</h2>
      <ul>
        <li>You must provide accurate registration and profile information.</li>
        <li>
          You are responsible for safeguarding your login credentials and for
          activity under your account.
        </li>
        <li>
          Caregivers must maintain required qualifications and credentials;
          expired or unverified credentials may limit claiming shifts.
        </li>
      </ul>

      <h2>3. Accurate scheduling and attendance</h2>
      <p>
        Clients and facilities must not falsely report caregiver no-shows. If a
        caregiver has clocked in, or arrival has been confirmed, a no-show cannot
        be recorded through the platform. Disputes must be raised with the
        agency.
      </p>

      <h2>4. Caregiver transportation and wellbeing</h2>
      <p>
        Caregivers are responsible for their own transportation to and from
        client homes and for their own wellbeing while traveling to and while
        working in the client’s home. OkayNow and the client do not provide or
        guarantee transportation, and caregivers should take reasonable steps to
        keep themselves safe and fit for duty.
      </p>

      <h2>5. Off-platform hiring (conversion)</h2>
      <p>
        If you connect with a caregiver through OkayNow and then hire or continue
        that caregiver privately outside the platform for ongoing care, you agree
        to pay the Platform Conversion Fee set in Agency Settings (shown on your
        rate card). The fee is invoiced when you report the conversion or when
        the agency discovers it.
      </p>

      <h2>6. Fees and invoices</h2>
      <p>
        Rejection fees, conversion fees, and shift bill rates are due as
        invoiced. Non-payment may result in suspension of account access.
      </p>

      <h2>7. Acceptable use</h2>
      <ul>
        <li>
          Do not solicit or arrange private payment to bypass OkayNow for
          caregivers introduced on the platform without paying applicable fees.
        </li>
        <li>
          Do not falsify attendance, clock times, credentials, or no-show
          reports.
        </li>
        <li>
          Do not misuse location, messaging, or visit features, or attempt to
          access data you are not authorized to see.
        </li>
      </ul>

      <h2>8. Privacy</h2>
      <p>
        Our collection and use of personal information is described in the{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT
        PERMITTED BY LAW, OKAYNOW DISCLAIMS WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not
        guarantee uninterrupted availability or that every shift will be filled.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, OKAYNOW AND ITS OPERATORS WILL
        NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
        PUNITIVE DAMAGES, OR FOR LOST PROFITS OR DATA, ARISING FROM YOUR USE OF
        THE SERVICE. OUR TOTAL LIABILITY FOR CLAIMS RELATING TO THE SERVICE IS
        LIMITED TO THE AMOUNTS PAID TO OKAYNOW FOR THE SERVICE IN THE TWELVE
        MONTHS BEFORE THE CLAIM, OR ONE HUNDRED DOLLARS (US $100), WHICHEVER IS
        GREATER, EXCEPT WHERE LIABILITY CANNOT BE LIMITED UNDER APPLICABLE LAW.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may suspend or terminate access for violations of these Terms, unpaid
        fees, safety concerns, or inactive accounts. You may stop using OkayNow
        at any time. Provisions that by their nature should survive will survive
        termination.
      </p>

      <h2>12. Updates</h2>
      <p>
        OkayNow may publish updated Terms. Continued use after publication of a
        new version may require your acceptance of that version in the product.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a
          className="font-medium text-brand-deep underline-offset-2 hover:underline"
          href="mailto:mutwalibb@gmail.com"
        >
          mutwalibb@gmail.com
        </a>
        . See <Link href="/support">Support</Link>.
      </p>

      <p className="text-ink-muted">
        These materials are provided for platform use and are not legal advice.
        Confirm final wording with counsel before relying on them for regulated
        offerings.
      </p>
    </MarketingDocShell>
  );
}
