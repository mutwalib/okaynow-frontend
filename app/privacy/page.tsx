import type { Metadata } from "next";
import Link from "next/link";
import { MarketingDocShell } from "@/components/marketing-doc-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How OkayNow collects, uses, and protects personal information for Massachusetts home care staffing.",
};

export default function PrivacyPage() {
  return (
    <MarketingDocShell title="Privacy Policy" updated="August 12, 2026">
      <p>
        This Privacy Policy describes how OkayNow (“OkayNow,” “we,” “us”)
        collects, uses, and shares information when you use our websites and
        mobile applications for home care and adult care staffing in
        Massachusetts.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information</strong> — email, phone, name, role
          (caregiver, client, facility, or admin), and authentication data.
        </li>
        <li>
          <strong>Profile &amp; credentials</strong> — qualifications,
          licenses/certifications, background-check status, service area, and
          documents you upload for verification.
        </li>
        <li>
          <strong>Scheduling &amp; care operations</strong> — shifts, claims,
          assignments, care notes you enter, and related messages or
          notifications.
        </li>
        <li>
          <strong>Visit verification (EVV-ready)</strong> — clock-in/out times
          and GPS coordinates when location-based visit verification is used.
        </li>
        <li>
          <strong>Billing &amp; payroll-related data</strong> — pay rates, bill
          rates, hours, invoices, and settlement status as needed to operate the
          agency model.
        </li>
        <li>
          <strong>Device &amp; usage data</strong> — app version, approximate
          diagnostics, and logs needed to keep the service secure and reliable.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide scheduling, matching, clock-in/out, and account features.</li>
        <li>
          Operate W-2 staffing workflows, invoicing, and compliance-oriented
          visit records for Massachusetts home care.
        </li>
        <li>Communicate about shifts, credentials, security, and support.</li>
        <li>Improve reliability, prevent fraud, and enforce our Terms.</li>
      </ul>

      <h2>3. How we share information</h2>
      <p>
        We do not sell personal information. We share information only as needed
        to run the service, for example:
      </p>
      <ul>
        <li>
          With the agency operating OkayNow and authorized staff for scheduling,
          credentialing, payroll, and support.
        </li>
        <li>
          With clients or facilities as needed for assigned shifts (for example,
          caregiver name and visit status).
        </li>
        <li>
          With service providers (hosting, email/SMS, maps, storage) under
          contracts that limit use to providing services to us.
        </li>
        <li>
          When required by law, regulation, or valid legal process, or to protect
          rights, safety, and security.
        </li>
      </ul>

      <h2>4. Sensitive &amp; location data</h2>
      <p>
        Client addresses, care needs, and visit/GPS records are treated as
        sensitive. Access is role-restricted and audited where appropriate.
        Location is used for clock-in/out and service-area features you enable;
        you can control location permission in your device settings.
      </p>

      <h2>5. Retention</h2>
      <p>
        We retain information for as long as your account is active and as needed
        for staffing, billing, dispute resolution, and legal or regulatory
        obligations (including visit records where EVV or similar requirements
        apply).
      </p>

      <h2>6. Security</h2>
      <p>
        We use administrative, technical, and organizational measures designed to
        protect personal information. No method of transmission or storage is
        fully secure; please use a strong unique password and protect your
        devices.
      </p>

      <h2>7. Your choices</h2>
      <ul>
        <li>Update profile details in the app or web portal where available.</li>
        <li>Request access or correction by contacting support.</li>
        <li>
          Request account closure; we may retain limited records as required by
          law or legitimate business needs.
        </li>
      </ul>

      <h2>8. Children</h2>
      <p>
        OkayNow is not directed to children under 13, and we do not knowingly
        collect personal information from children under 13.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this Policy. Material changes will be posted on this page
        with an updated date. Continued use after changes means you accept the
        updated Policy where permitted by law. In-app acceptance may be required
        for new versions.
      </p>

      <h2>10. Contact</h2>
      <p>
        Privacy questions:{" "}
        <a
          className="font-medium text-brand-deep underline-offset-2 hover:underline"
          href="mailto:mutwalibb@gmail.com"
        >
          mutwalibb@gmail.com
        </a>
        . See also our <Link href="/support">Support</Link> page.
      </p>
    </MarketingDocShell>
  );
}
