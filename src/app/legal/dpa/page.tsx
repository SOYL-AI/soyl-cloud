import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, Section } from "@/components/legal/LegalPage";
import { COMPANY, SITE_URL } from "@/lib/constants";
import { AZURE_RETENTION, LEGAL_UPDATED, SUB_PROCESSORS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Data Processing Addendum",
  description:
    "The terms on which SOYL Cloud processes personal data on your behalf: scope, sub-processors, security, breach notification, deletion and audit.",
  alternates: { canonical: `${SITE_URL}/legal/dpa` },
  openGraph: {
    title: "Data Processing Addendum — SOYL Cloud",
    description: "How we process personal data on your behalf, and what we commit to.",
    url: `${SITE_URL}/legal/dpa`,
  },
};

export default function DataProcessingAddendum() {
  return (
    <LegalPage
      title="Data Processing Addendum"
      summary="You are the data fiduciary; we are your processor. We act only on your instructions, we tell you before adding a sub-processor, we notify you of a breach without undue delay, and we delete your data on request. One thing worth reading in full is clause 5 on model provider retention."
      updated={LEGAL_UPDATED}
    >
      <Section number="1." title="When this applies">
        <p>
          This addendum applies where you use {COMPANY.name} to process personal data and
          forms part of the{" "}
          <Link className="underline" href="/legal/terms">
            Terms of Service
          </Link>
          . Where the two conflict on data protection, this document prevails.
        </p>
        <p>
          Under the Digital Personal Data Protection Act, 2023, you are the{" "}
          <strong>Data Fiduciary</strong> and we are a <strong>Data Processor</strong>{" "}
          acting on your behalf. Under the GDPR the equivalent roles are controller and
          processor.
        </p>
        <p>
          If you would prefer a signed copy on your own paper, write to{" "}
          <a className="underline" href={`mailto:${COMPANY.email}`}>
            {COMPANY.email}
          </a>{" "}
          and we will sign one.
        </p>
      </Section>

      <Section number="2." title="Scope of processing">
        <p>
          <strong>Subject matter.</strong> Providing a service that answers questions from
          documents you upload.
        </p>
        <p>
          <strong>Duration.</strong> For as long as your account is open, plus the deletion
          window in clause 8.
        </p>
        <p>
          <strong>Nature and purpose.</strong> Storage, text extraction, indexing,
          retrieval, and generating answers using a language model.
        </p>
        <p>
          <strong>Categories of data subject.</strong> Your staff who use the service, and
          any individuals named in documents you choose to upload.
        </p>
        <p>
          <strong>Categories of personal data.</strong> Account identifiers and
          authentication data for your staff. For document content, whatever you upload —
          which is within your control, and which clause 3 asks you to keep minimal.
        </p>
      </Section>

      <Section number="3." title="Our obligations">
        <p>We will:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            process personal data only on your documented instructions, which include your
            use of the service itself;
          </li>
          <li>
            not use your content to train models, ours or anyone else&rsquo;s, and not
            permit our sub-processors to;
          </li>
          <li>
            ensure people with access are bound by confidentiality and have access only
            where their role requires it;
          </li>
          <li>implement the measures in clause 6;</li>
          <li>assist you in responding to data principal requests;</li>
          <li>
            tell you if in our opinion an instruction you give us would breach applicable
            law.
          </li>
        </ul>
        <p>
          <strong>What we ask of you.</strong> SOYL is designed for operational documents.
          Please do not upload guest databases, payment card data, or health records. The
          service has no feature that needs them, and uploading them creates obligations
          for you that the product is not designed to help you meet.
        </p>
      </Section>

      <Section number="4." title="Sub-processors">
        <p>
          You give general authorisation for the sub-processors below. We will update this
          page and email your nominated contact at least thirty days before adding a new
          one. If you object on reasonable data protection grounds, tell us within those
          thirty days and we will either find an alternative or let you terminate without
          penalty.
        </p>

        <div className="my-5 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-soyl-gray-200)]">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Sub-processor
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Purpose
                </th>
                <th scope="col" className="py-2 font-semibold">
                  Location
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
                  <td className="py-3">{processor.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          We remain liable to you for our sub-processors&rsquo; acts and omissions as if
          they were our own.
        </p>
      </Section>

      <Section number="5." title="Model provider retention">
        <p>
          This clause is separated out because it is the one most likely to matter to your
          own review, and we would rather you read it here than discover it later.
        </p>
        <p>{AZURE_RETENTION}</p>
        <p>
          In practice, what reaches the model is your question plus the passages retrieved
          to answer it — never a whole document, and never your document library. We strip
          identifiable personal data patterns before the call where we can detect them.
        </p>
        <p>
          If your own obligations require zero retention by the model provider, tell us.
          Disabling abuse monitoring is possible and we will discuss it with you, along
          with what we would put in its place.
        </p>
      </Section>

      <Section number="6." title="Security measures">
        <p>
          <strong>Separation between customers</strong> is enforced in the database, not in
          application code. Every table carrying customer data has a policy attached to it
          that the application cannot bypass, and an automated test suite proves one
          customer cannot read another&rsquo;s rows. That suite cannot be skipped before a
          release.
        </p>
        <p>
          <strong>Encryption.</strong> TLS in transit; encryption at rest for both the
          database and document storage.
        </p>
        <p>
          <strong>Authentication.</strong> Passwords hashed with Argon2id. Sessions are
          revocable immediately rather than expiring on their own.
        </p>
        <p>
          <strong>Access control and logging.</strong> Production access is limited to
          those who require it. Every access to customer data through administrative tools
          is recorded in an append-only audit log.
        </p>
        <p>
          <strong>Provenance.</strong> Every factual statement in an answer must reference
          a passage that was actually retrieved. Statements that cannot be traced are
          removed before the answer is shown, and the removal is logged.
        </p>
      </Section>

      <Section number="7." title="Personal data breach">
        <p>
          We will notify your nominated contact without undue delay, and in any case within
          seventy-two hours of becoming aware of a personal data breach affecting your
          data. The notification will describe what happened, what data was involved, what
          we have done, and what we recommend you do.
        </p>
        <p>
          We will not delay notification while we complete an investigation. You will hear
          from us with an incomplete picture rather than late with a complete one.
        </p>
      </Section>

      <Section number="8." title="Return and deletion">
        <p>
          On termination, or at any point on request, we will return your data in a usable
          format and delete it. Deletion covers the original files, extracted text, all
          derived passages and all embeddings.
        </p>
        <p>
          Encrypted backups may hold a copy for up to thirty days, after which they expire
          on their own schedule. We will confirm deletion in writing on request.
        </p>
      </Section>

      <Section number="9." title="Audit">
        <p>
          On reasonable notice and no more than once a year, we will answer a written
          security questionnaire and provide evidence of the measures in clause 6. Where
          that is insufficient for your own obligations, we will discuss an on-site or
          third-party audit at your cost.
        </p>
      </Section>

      <Section number="10." title="Cross-border transfer">
        <p>
          Some sub-processors in clause 4 operate outside India. Where personal data is
          transferred outside India, we rely on the transfer mechanisms permitted under the
          DPDP Act and, where the GDPR applies, on Standard Contractual Clauses.
        </p>
        <p>
          If you require data residency within a specific jurisdiction, tell us before you
          upload anything. It is a solvable problem, but it is a configuration decision
          rather than something we can apply retrospectively.
        </p>
      </Section>
    </LegalPage>
  );
}
