/**
 * The facts the legal pages are built from.
 *
 * Kept in one place because privacy policy, terms and DPA all describe the same
 * system, and three prose copies of "who processes your data" is three chances
 * for one of them to become untrue after an infrastructure change. When a
 * sub-processor changes, this list changes and all three pages follow.
 *
 * **Everything here must be true of the deployed system.** A privacy policy is
 * a statement of fact about what software does, and the failure mode is not a
 * fine — it is a pilot's counsel finding a discrepancy in the first document
 * they read.
 */

/**
 * Last substantive revision. Not `new Date()`: a policy that claims to have
 * been updated today, every day, tells a reader nothing and quietly destroys
 * the one signal the date exists to give.
 */
export const LEGAL_UPDATED = "29 July 2026";

export type SubProcessor = {
  name: string;
  purpose: string;
  /** What actually reaches them. Specific, because "data" is not a disclosure. */
  data: string;
  location: string;
};

export const SUB_PROCESSORS: SubProcessor[] = [
  {
    name: "Microsoft Azure (Azure OpenAI Service)",
    purpose: "Generating answers, embeddings and search suggestions",
    data: "Passages from your uploaded documents that are relevant to a question, and the question itself",
    location: "Microsoft Azure region configured for the deployment",
  },
  {
    name: "Railway",
    purpose: "Application hosting, database and job queue",
    data: "All account and document metadata, document text, and the answer history",
    location: "Railway managed infrastructure",
  },
  {
    name: "Cloudflare R2",
    purpose: "Storage of the document files you upload",
    data: "The original files, exactly as uploaded",
    location: "Cloudflare global object storage",
  },
  {
    name: "Vercel",
    purpose: "Hosting and delivery of the website and application interface",
    data: "Request metadata such as IP address and user agent",
    location: "Vercel edge network",
  },
  {
    name: "Resend",
    purpose: "Transactional email — verification and password reset only",
    data: "Your email address and the contents of those messages",
    location: "Resend infrastructure",
  },
  {
    name: "Plausible Analytics",
    purpose: "Website analytics",
    data: "Page views and funnel events. No cookies, no cross-site identifiers, no personal data",
    location: "European Union",
  },
];

/**
 * The Azure retention disclosure.
 *
 * `docs/phase-0/DECISION-LOG.md` records this as a founder's decision with a
 * stated consequence: abuse monitoring stays on until a replacement guardrail
 * exists, and Microsoft therefore retains prompts and completions for up to
 * thirty days for abuse review.
 *
 * The log says it is "disclosable, not disqualifying — but it must appear in
 * the DPA rather than be discovered". This is where it appears.
 */
export const AZURE_RETENTION =
  "Microsoft retains prompts and the model's responses for up to thirty days for " +
  "abuse monitoring, and may review them where automated systems flag a potential " +
  "policy violation. Microsoft does not use this content to train its models. We " +
  "have chosen to leave abuse monitoring enabled because it is currently the only " +
  "control watching for misuse of the model, and we will disclose here if that changes.";
