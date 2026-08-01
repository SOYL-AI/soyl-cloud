/**
 * Admin panel types, the inspector's verdict, and the table formatters.
 *
 * Split from `admin.ts` for one reason: that module imports `next/navigation`
 * and, through `session.ts`, `next/headers`, and neither resolves under
 * `node --test`. `verdict()` is M6's acceptance criterion expressed as code and
 * it has to be testable, so the pure half lives here and the fetching half
 * imports it.
 */

export type TenantSummary = {
  tenant_id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  member_count: number;
  property_count: number;
  document_count: number;
  question_count: number;
  last_active_at: string | null;
};

export type QuestionRow = {
  turn_id: string;
  conversation_id: string;
  tenant_id: string;
  tenant_name: string;
  user_email: string | null;
  question: string;
  status: string;
  asked_at: string;
  latency_ms: number | null;
  cost_inr: number;
};

export type InspectorChunk = {
  chunk_id: string;
  document_id: string | null;
  document_title: string | null;
  heading_path: string[];
  ordinal: number | null;
  token_count: number | null;
  content: string;
  score: number;
  kept: boolean;
};

export type Inspection = {
  turn: {
    turn_id: string;
    conversation_id: string;
    tenant_id: string;
    tenant_name: string;
    user_email: string | null;
    question: string;
    status: string;
    asked_at: string;
    completed_at: string | null;
    latency_ms: number | null;
    input_tokens: number;
    output_tokens: number;
    cost_inr: number;
    trace_id: string | null;
  };
  retrieval: {
    query: string | null;
    filters: Record<string, unknown>;
    reranked: boolean;
    latency_ms: number | null;
    kept: number;
    rejected: number;
  };
  chunks: InspectorChunk[];
  draft: unknown;
  strips: { block_id?: string; block_type?: string; reason?: string }[];
  envelope: unknown;
  usage: {
    kind: string;
    provider: string | null;
    model: string | null;
    input_tokens: number;
    output_tokens: number;
    cost_inr: number;
  }[];
  feedback: {
    target_kind: string;
    target_id: string;
    signal: string;
    reasons: string[];
    correction: string | null;
    created_at: string;
  }[];
};

export type AdminDocument = {
  document_id: string;
  tenant_id: string;
  tenant_name: string;
  title: string;
  doc_type: string;
  status: string;
  page_count: number | null;
  chunk_count: number;
  created_at: string;
  job_status: string | null;
  job_stage: string | null;
  job_error: string | null;
  attempts: number;
};

export type FunnelWeek = {
  week: string;
  signed_up: number;
  verified: number;
  created_property: number;
  uploaded_document: number;
  asked_question: number;
  returned_week_two: number;
};

export type CostRow = {
  day: string;
  tenant_id: string;
  tenant_name: string;
  cost_inr: number;
  input_tokens: number;
  output_tokens: number;
  calls: number;
};


/**
 * The one-line explanation the inspector opens with.
 *
 * This function *is* M6's acceptance criterion (`UPDATE.md` §12: "you can take
 * any answer the system gave, open it in the inspector, and explain in under a
 * minute why it said what it said"). A screen that opens with JSON makes the
 * reader do the diagnosis; this states a conclusion and puts the evidence
 * below it.
 *
 * It lives here rather than in the page so it can be tested, because the
 * branches it gets wrong are the ones that only occur when something has
 * already gone wrong — a failed turn, a turn that never finished, a retrieval
 * that returned nothing at all — and those are exactly the ones nobody would
 * think to check by hand.
 */
export function verdict(data: Inspection): { headline: string; detail: string } {
  const { turn, retrieval, chunks, strips } = data;
  const kept = chunks.filter((chunk) => chunk.kept);
  const rejected = chunks.filter((chunk) => !chunk.kept);
  const best = rejected.length > 0 ? Math.max(...rejected.map((c) => c.score)) : null;

  if (turn.status === "failed") {
    return {
      headline: "The pipeline failed before it could answer.",
      detail:
        turn.trace_id ??
        "No reason was recorded, which is itself a bug — fail_turn writes the provider error into trace_id.",
    };
  }

  if (turn.status === "running") {
    return {
      headline: "This turn never finished.",
      detail:
        "It was written before the model was called and never updated to a terminal status. Either it is still in flight, or the process died mid-answer.",
    };
  }

  if (turn.status === "refused") {
    return {
      headline: "The guard rejected the question before anything was spent on it.",
      detail: "Too short, too long, or empty. No retrieval and no model call happened.",
    };
  }

  if (turn.status === "no_evidence") {
    // Two very different bugs wear the same status, and separating them is the
    // single most useful thing this screen does.
    if (chunks.length === 0) {
      return {
        headline: "Retrieval found nothing at all, so it declined to answer.",
        detail:
          "Not a reranking problem — no candidate passage came back from any of the three searches. Check the document is ingested, the property filter, and whether the document has expired.",
      };
    }
    return {
      headline: `Retrieval found ${count(chunks.length)} ${chunks.length === 1 ? "passage" : "passages"} and the reranker rejected ${rejected.length === chunks.length ? "all of them" : count(rejected.length)}.`,
      detail:
        best === null
          ? "It said “I don’t have that” rather than answering from weak evidence, which is the correct behaviour."
          : `The best rejected score was ${best.toFixed(3)}. If the right passage is in the rejected list below, this is a reranking problem. If it is not, it is a retrieval problem.`,
    };
  }

  const stripped =
    strips.length > 0
      ? ` ${count(strips.length)} ${strips.length === 1 ? "block was" : "blocks were"} removed by the validator for citing nothing.`
      : "";

  return {
    headline: `Answered from ${count(kept.length)} ${kept.length === 1 ? "passage" : "passages"}.${stripped}`,
    detail: retrieval.reranked
      ? `The reranker ran and ordered ${count(chunks.length)} candidates; ${count(rejected.length)} fell below the threshold.`
      : "The reranker did not run — fusion order was used instead. A quality regression nobody can account for is usually this.",
  };
}

/** `1,240` rather than `1240`. Small, and it is most of what makes a table readable. */
export function count(value: number): string {
  return value.toLocaleString("en-IN");
}

export function rupees(value: number): string {
  // Four decimal places, because a single answer costs a fraction of a rupee
  // and rounding to two turns the whole cost screen into a column of ₹0.00.
  return `₹${value.toFixed(4)}`;
}

export function when(value: string | null): string {
  if (!value) return "—";
  const at = new Date(value);
  const days = (Date.now() - at.getTime()) / 86_400_000;
  // Absolute once it is old enough that "37 days ago" stops being a date
  // anyone can place.
  if (days > 14) return at.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return relative(at);
}

function relative(at: Date): string {
  const seconds = Math.round((Date.now() - at.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
