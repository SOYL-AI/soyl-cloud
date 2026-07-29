import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, Section } from "@/components/legal/LegalPage";
import { COMPANY, SITE_URL } from "@/lib/constants";
import { AZURE_RETENTION, LEGAL_UPDATED, SUB_PROCESSORS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What SOYL Cloud collects, where it goes, how long we keep it, and how to get it deleted. Written under India's DPDP Act, 2023.",
  alternates: { canonical: `${SITE_URL}/legal/privacy` },
  openGraph: {
    title: "Privacy Policy — SOYL Cloud",
    description: "What we collect, where it goes, and how to get it deleted.",
    url: `${SITE_URL}/legal/privacy`,
  },
};

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="We hold two kinds of data: the account details you give us, and the documents you upload. Documents are only ever used to answer your own questions. We do not sell anything, we do not advertise, and deletion means the file, its extracted text and its embeddings are all removed."
      updated={LEGAL_UPDATED}
    >
      <Section number="1." title="Who we are">
        <p>
          {COMPANY.name} is operated from {COMPANY.address}, India. For anything in this
          policy, write to{" "}
          <a className="underline" href={`mailto:${COMPANY.email}`}>
            {COMPANY.email}
          </a>
          .
        </p>
        <p>
          This policy is written under the Digital Personal Data Protection Act, 2023
          (&ldquo;DPDP&rdquo;). Where you are in a jurisdiction with stronger rights, we
          apply those.
        </p>
      </Section>

      <Section number="2." title="What we collect">
        <p>
          <strong>Account data.</strong> Your email address, a display name if you give
          one, and a hash of your password. We never store the password itself.
        </p>
        <p>
          <strong>Workspace data.</strong> The name of your property or group, the
          properties you add, and who else you invite.
        </p>
        <p>
          <strong>Documents you upload.</strong> The file, the text extracted from it, and
          numerical representations of that text used for search. See section 4.
        </p>
        <p>
          <strong>Questions and answers.</strong> Every question asked in your workspace,
          the passages retrieved to answer it, and the answer given. This is kept
          permanently while your account is open — it is how the product is improved, and
          how we can explain why a particular answer was given.
        </p>
        <p>
          <strong>Technical data.</strong> IP address, browser and device type, and
          timestamps, recorded when you use the service.
        </p>
        <p>
          We do not use cookies for advertising or tracking. The only cookie we set is the
          one that keeps you signed in.
        </p>
      </Section>

      <Section number="3." title="What we do with it">
        <p>
          Account and workspace data operates the service: signing you in, showing you your
          own data and nobody else&rsquo;s, and sending the two emails we send — address
          verification and password reset.
        </p>
        <p>
          Documents are used for one purpose: answering questions asked inside your own
          workspace. They are not used to train any model, ours or anyone else&rsquo;s.
          They are not shared with other customers. They are not read by us except where
          you ask us to look at something specific, or where we are compelled by law.
        </p>
        <p>
          Questions and answers are used to measure and improve retrieval quality, and to
          decide what to build. Where we use this to improve the product, we work with the
          question text and our own performance data — not with the contents of your
          documents.
        </p>
      </Section>

      <Section number="4." title="Your documents, specifically">
        <p>
          This is the part most people want to understand, so it is stated plainly.
        </p>
        <p>
          When you upload a document, the file is stored encrypted. We extract its text,
          split it into passages, and compute an embedding for each — a list of numbers
          representing meaning, which is what makes search work. The file, the passages and
          the embeddings all live in your workspace and are readable only within it. This
          is enforced in the database itself rather than in application code, so a mistake
          in our software cannot expose one customer&rsquo;s documents to another.
        </p>
        <p>
          When you ask a question, the passages most relevant to it — and only those — are
          sent to our model provider along with your question. Whole documents are never
          sent.
        </p>
        <p>
          Before that happens, we strip out patterns that look like guest personal data
          (names, email addresses, phone numbers) where we can identify them, so that the
          minimum necessary content reaches the model.
        </p>
      </Section>

      <Section number="5." title="Who else processes it">
        <p>
          We use the following sub-processors. This list is current as of the date at the
          top of this page, and we will update it here before adding a new one.
        </p>

        <div className="my-5 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-soyl-gray-200)]">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Processor
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Purpose
                </th>
                <th scope="col" className="py-2 font-semibold">
                  What reaches them
                </th>
              </tr>
            </thead>
            <tbody>
              {SUB_PROCESSORS.map((processor) => (
                <tr
                  key={processor.name}
                  className="border-b border-[var(--color-soyl-gray-100)] align-top"
                >
                  <td className="py-3 pr-4 font-medium text-[var(--color-soyl-charcoal)]">
                    {processor.name}
                  </td>
                  <td className="py-3 pr-4">{processor.purpose}</td>
                  <td className="py-3">{processor.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          <strong>One disclosure worth reading carefully.</strong> {AZURE_RETENTION}
        </p>
      </Section>

      <Section number="6." title="How long we keep things">
        <p>
          <strong>Documents</strong> are kept until you delete them or close your account.
        </p>
        <p>
          <strong>Questions and answers</strong> are kept while your account is open,
          because the history is part of the product.
        </p>
        <p>
          <strong>Access and audit records</strong> are kept for twelve months. These
          record who did what, and shortening them would remove our ability to investigate
          a security incident.
        </p>
        <p>
          <strong>On account closure,</strong> everything above is deleted within thirty
          days, other than records we are required by law to retain.
        </p>
      </Section>

      <Section number="7." title="Deletion means deletion">
        <p>
          When you delete a document, we remove the file, the extracted text, every passage
          derived from it and every embedding. It stops being findable immediately and is
          gone rather than flagged as hidden.
        </p>
        <p>
          Encrypted backups may retain a copy for up to thirty days, after which they
          expire. We do not restore deleted content from backup.
        </p>
      </Section>

      <Section number="8." title="Your rights">
        <p>Under the DPDP Act you may:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>ask what personal data we hold about you and get a copy;</li>
          <li>have inaccurate data corrected;</li>
          <li>have your data erased;</li>
          <li>nominate someone to exercise these rights if you are unable to;</li>
          <li>complain to the Data Protection Board of India.</li>
        </ul>
        <p>
          Write to{" "}
          <a className="underline" href={`mailto:${COMPANY.email}`}>
            {COMPANY.email}
          </a>{" "}
          and we will respond within thirty days. We will not charge you for a request, and
          we will not ask why you are making one.
        </p>
        <p>
          If you are an employee of a hotel using SOYL, your employer is the data fiduciary
          for the documents in their workspace and we act on their instructions — address
          requests about that content to them, and we will help them respond.
        </p>
      </Section>

      <Section number="9." title="Security">
        <p>
          Data is encrypted in transit and at rest. Access to production systems is limited
          to the people who need it and is logged. Passwords are hashed with Argon2id.
          Separation between customers is enforced by the database, and we run an automated
          test suite against that separation which cannot be skipped before a release.
        </p>
        <p>
          If we discover a breach affecting your data, we will tell you and the Data
          Protection Board without undue delay.
        </p>
      </Section>

      <Section number="10." title="Children">
        <p>
          SOYL is a tool for hotel staff and is not directed at anyone under 18. We do not
          knowingly collect data about children.
        </p>
      </Section>

      <Section number="11." title="Changes">
        <p>
          If we change this policy in a way that materially affects you, we will email you
          before it takes effect. Minor corrections are made here with the date at the top
          updated.
        </p>
        <p>
          See also our{" "}
          <Link className="underline" href="/legal/terms">
            Terms of Service
          </Link>{" "}
          and, if you are a customer,{" "}
          <Link className="underline" href="/legal/dpa">
            Data Processing Addendum
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
