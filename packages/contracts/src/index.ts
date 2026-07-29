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

// ── The Response Envelope ───────────────────────────────────────────────────
//
// `UPDATE.md` §6.3. The single artifact the answer pipeline produces, and the
// reason this package exists.
//
// Hand-written rather than generated, because this is the file a frontend
// engineer reads to understand what an answer *is*, and generated types are
// unreadable. The cost of hand-writing is drift; `contracts.test.mts` removes
// it by checking every field here against the JSON Schema the API emits from
// its Pydantic models.
//
// The frontend validates every block before rendering (§6.3). A block whose
// shape it does not recognise is skipped, not guessed at — a renderer that
// improvises on unknown input is how one bad envelope takes down a page.

export type BlockType =
  | "text.markdown"
  | "doc.citation"
  | "list.checklist"
  | "alert.callout";

export type Confidence = "high" | "medium" | "low";
export type AlertLevel = "info" | "warning" | "critical";

/**
 * Why a turn ended.
 *
 * `no_evidence` is a first-class outcome, not an error. §9: refusal is a valid,
 * well-designed outcome, and the UI must render it as deliberate rather than as
 * a failure state.
 */
export type TurnStatus = "complete" | "no_evidence" | "refused" | "failed";

export type TextMarkdownBlock = {
  id: string;
  type: "text.markdown";
  title: string | null;
  payload: { markdown: string };
  provenance_refs: string[];
  confidence: Confidence;
};

/** A quotation, denormalised so it still renders if the document is deleted. */
export type DocCitationBlock = {
  id: string;
  type: "doc.citation";
  title: string | null;
  payload: {
    chunk_id: string;
    document_id: string;
    document_title: string;
    heading_path: string[];
    quote: string;
  };
  provenance_refs: string[];
  confidence: Confidence;
};

export type ListChecklistBlock = {
  id: string;
  type: "list.checklist";
  title: string | null;
  payload: { items: { text: string; done: boolean }[] };
  provenance_refs: string[];
  confidence: Confidence;
};

/**
 * The pipeline's own voice: a safety caveat, or a statement about the corpus
 * itself. The only block type exempt from the provenance requirement, because
 * "no document covers this" is a claim about what we hold rather than one drawn
 * from it.
 */
export type AlertCalloutBlock = {
  id: string;
  type: "alert.callout";
  title: string | null;
  payload: { level: AlertLevel; markdown: string };
  provenance_refs: string[];
  confidence: Confidence;
};

export type Block =
  | TextMarkdownBlock
  | DocCitationBlock
  | ListChecklistBlock
  | AlertCalloutBlock;

/** One retrieved chunk, referenced by blocks rather than duplicated in them. */
export type SourceRef = {
  id: string;
  chunk_id: string;
  document_id: string;
  document_title: string;
  heading_path: string[];
  excerpt: string;
  /** Null when reranking was skipped — distinct from a score of zero. */
  score: number | null;
};

export type Envelope = {
  envelope_id: string;
  version: number;
  turn_id: string;
  conversation_id: string;
  tenant_id: string;
  created_at: string;
  locale: string;
  status: TurnStatus;
  intent: {
    question: string;
    property_ids: string[];
    unresolved: string[];
  };
  summary: {
    headline: string;
    confidence: Confidence;
  };
  /** Advisory. A client may ignore it and render `blocks` in order. */
  layout: {
    kind: "stack" | "grid";
    cols: number;
    slots: { block_id: string; span: number }[];
  };
  blocks: Block[];
  provenance: { documents: SourceRef[] };
  followups: string[];
  diagnostics: {
    degraded: boolean;
    warnings: string[];
    reranked: boolean;
    /** Blocks the provenance validator removed (§6.4). */
    stripped_blocks: number;
    usage: {
      input_tokens: number;
      output_tokens: number;
      cost_inr: number;
      wall_ms: number;
    };
  };
};

/** What `POST /v1/answers` accepts. */
export type AskRequest = {
  question: string;
  conversation_id?: string | null;
  property_ids?: string[];
  idempotency_key?: string | null;
};

/** What it returns. */
export type AskResponse = {
  turn_id: string;
  conversation_id: string;
  envelope: Envelope;
};
