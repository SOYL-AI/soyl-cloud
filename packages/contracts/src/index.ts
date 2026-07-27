/**
 * The web/API contract surface.
 *
 * These types are the source of truth for the *shape* the two sides agree on,
 * but not for the *rules* — the API's Pydantic models are. `contracts.test.mts`
 * checks each type here against the JSON Schema the API generates, so a field
 * added or renamed on one side fails a test rather than a request in
 * production. Keep every type in this file narrow enough for that check to be
 * meaningful.
 *
 * Phase 0 needs one contract. The Response Envelope (`UPDATE.md` §6.3) lands
 * here in M4 and is the reason this package exists at all.
 */

/** What `/contact` sends the API after the form has been validated and accepted. */
export type LeadCreate = {
  name: string;
  email: string;
  company: string;
  message: string;
  /** Absolute URL of the page the form was submitted from. */
  source_url: string | null;
};

/** What the API returns once the lead is persisted. */
export type LeadCreated = {
  id: string;
  created_at: string;
};
