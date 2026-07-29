import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, Section } from "@/components/legal/LegalPage";
import { COMPANY, SITE_URL } from "@/lib/constants";
import { LEGAL_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The agreement covering your use of SOYL Cloud: what we provide, what you are responsible for, and what happens if either of us stops.",
  alternates: { canonical: `${SITE_URL}/legal/terms` },
  openGraph: {
    title: "Terms of Service — SOYL Cloud",
    description: "What we provide, what you are responsible for, and how either side ends it.",
    url: `${SITE_URL}/legal/terms`,
  },
};

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      summary="You keep ownership of everything you upload. We provide the service, keep your data separate from everyone else's, and give it back or delete it when you leave. The service answers from your documents and can be wrong, so it does not replace professional judgement."
      updated={LEGAL_UPDATED}
    >
      <Section number="1." title="This agreement">
        <p>
          These terms are between {COMPANY.name} and the organisation whose staff use the
          service. Creating an account means accepting them. If you are accepting on behalf
          of a company, you are confirming you may bind it.
        </p>
      </Section>

      <Section number="2." title="What we provide">
        <p>
          A service that answers questions from documents you upload, citing the passage
          each answer came from. During the pilot period the service is provided free of
          charge and without a committed availability target, and we will tell you before
          that changes.
        </p>
        <p>
          We may change how the service works. Where a change removes something you rely
          on, we will give you thirty days&rsquo; notice by email.
        </p>
      </Section>

      <Section number="3." title="Your content stays yours">
        <p>
          You retain all rights in the documents you upload and everything derived from
          them. We do not acquire any licence to them beyond what is needed to run the
          service for you: storing them, indexing them, and sending the relevant parts to
          our model provider to answer your questions.
        </p>
        <p>
          <strong>We do not train models on your content</strong>, and we do not permit our
          providers to. This is a commitment rather than a current practice we might
          revisit — if it ever changes it will require your explicit agreement first.
        </p>
      </Section>

      <Section number="4." title="What you are responsible for">
        <p>
          That you have the right to upload what you upload. That you do not upload
          material you are contractually or legally barred from processing this way.
        </p>
        <p>
          Keeping your credentials secure, and removing access for people who leave. You
          are responsible for what is done under your accounts.
        </p>
        <p>
          Minimising personal data. SOYL is built for operational documents — SOPs,
          contracts, policies, standards. It is not built to be a store of guest records,
          and uploading a guest database into it would be a poor use of it and a
          significant obligation for you.
        </p>
      </Section>

      <Section number="5." title="What the service does not do">
        <p>
          The service produces answers using a language model. It is designed to cite its
          sources and to say when it has nothing, and it is tested against that. It can
          still be wrong.
        </p>
        <p>
          <strong>Answers are not legal, financial, safety or medical advice.</strong> They
          are a faster way to find what your own documents say. Where an answer matters —
          and in a hotel, safety and licensing answers always matter — check the cited
          source. That is why every answer carries one.
        </p>
        <p>
          Nothing in the service replaces your obligation to keep your own documents
          accurate and current. An answer drawn correctly from an out-of-date policy is an
          out-of-date answer.
        </p>
      </Section>

      <Section number="6." title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>attempt to access another customer&rsquo;s data;</li>
          <li>probe, scan or load-test the service without written permission;</li>
          <li>
            use it to generate content that is unlawful, or to make decisions about
            individuals that you would not be able to explain to them;
          </li>
          <li>resell access, or use it to build a competing service.</li>
        </ul>
        <p>
          Security research is welcome. Write to{" "}
          <a className="underline" href={`mailto:${COMPANY.email}`}>
            {COMPANY.email}
          </a>{" "}
          first and we will not pursue you for good-faith testing under an agreed scope.
        </p>
      </Section>

      <Section number="7." title="Availability and support">
        <p>
          We aim for the service to be available whenever you need it, and during the pilot
          we do not offer a contractual uptime commitment. We will tell you about planned
          maintenance in advance where it will be noticeable.
        </p>
        <p>
          Support is by email to{" "}
          <a className="underline" href={`mailto:${COMPANY.email}`}>
            {COMPANY.email}
          </a>
          .
        </p>
      </Section>

      <Section number="8." title="Ending it">
        <p>
          You may stop using the service and close your account at any time, for any
          reason, without telling us why.
        </p>
        <p>
          We may suspend an account that is being used in breach of section 6, or where
          continuing would put other customers at risk. Except where the risk is immediate,
          we will tell you first and give you a chance to fix it.
        </p>
        <p>
          <strong>On termination you can export your data.</strong> We will provide your
          documents and your question history in a usable format on request within thirty
          days of closure, after which everything is deleted as described in the{" "}
          <Link className="underline" href="/legal/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section number="9." title="Liability">
        <p>
          Neither of us excludes liability for fraud, for death or personal injury caused
          by negligence, or for anything else that cannot lawfully be excluded.
        </p>
        <p>
          Subject to that, and because the service is currently provided free of charge,
          our aggregate liability to you is limited to ten thousand rupees. Neither of us
          is liable to the other for indirect or consequential loss, or for loss of profit,
          revenue or anticipated savings.
        </p>
        <p>
          If we begin charging you, this clause will be replaced by one proportionate to
          what you pay, agreed in writing.
        </p>
      </Section>

      <Section number="10." title="Governing law">
        <p>
          These terms are governed by the laws of India, and the courts of Bengaluru have
          exclusive jurisdiction. Before either of us starts proceedings, we agree to spend
          thirty days genuinely trying to resolve the matter by discussion.
        </p>
      </Section>

      <Section number="11." title="Changes to these terms">
        <p>
          We will email you at least thirty days before a material change takes effect. If
          you do not accept it, you may close your account and export your data under
          section 8, and the change will not apply to you in the meantime.
        </p>
        <p>
          Customers processing personal data through the service should also read the{" "}
          <Link className="underline" href="/legal/dpa">
            Data Processing Addendum
          </Link>
          , which forms part of this agreement.
        </p>
      </Section>
    </LegalPage>
  );
}
