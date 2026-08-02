/**
 * The answer inspector's verdict line.
 *
 * `UPDATE.md` §12 makes M6 acceptable when you can open any answer and explain
 * in under a minute why it said what it said. `verdict()` is that sentence, so
 * these tests are the closest a test can get to the acceptance criterion.
 *
 * They lean on the failure branches rather than the happy path. A `complete`
 * turn is what you look at while building the screen; a turn that failed, a
 * turn that never finished, and a `no_evidence` that found nothing at all are
 * the three you will actually open the inspector for, and they are the three
 * nobody would think to check by hand.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { count, rupees, verdict, when, type Inspection, type InspectorChunk } from "./admin-types.ts";

function chunk(score: number, kept: boolean): InspectorChunk {
  return {
    chunk_id: `c${score}-${kept}`,
    document_id: "d1",
    document_title: "front-office-sop.md",
    heading_path: ["Front Office", "5. Cancellation"],
    ordinal: 1,
    token_count: 400,
    content: "…",
    score,
    kept,
  };
}

function inspection(overrides: Partial<Inspection> = {}): Inspection {
  return {
    turn: {
      turn_id: "t1",
      conversation_id: "c1",
      tenant_id: "te1",
      tenant_name: "Harbour View Hotels",
      user_email: "priya@example.test",
      question: "What is the cancellation policy?",
      status: "complete",
      asked_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      latency_ms: 5049,
      input_tokens: 11771,
      output_tokens: 238,
      cost_inr: 0.3874,
      trace_id: null,
      ...(overrides.turn ?? {}),
    },
    retrieval: {
      query: "cancellation policy",
      filters: {},
      reranked: true,
      latency_ms: 5101,
      kept: 3,
      rejected: 5,
      ...(overrides.retrieval ?? {}),
    },
    chunks: overrides.chunks ?? [],
    draft: overrides.draft ?? null,
    strips: overrides.strips ?? [],
    envelope: overrides.envelope ?? null,
    usage: overrides.usage ?? [],
    feedback: overrides.feedback ?? [],
  };
}

// ── The answer worked ───────────────────────────────────────────────────────

test("a complete answer says how many passages it used", () => {
  const result = verdict(
    inspection({
      chunks: [chunk(1.0, true), chunk(0.9, true), chunk(0.8, true), chunk(0.2, false)],
    }),
  );

  assert.match(result.headline, /Answered from 3 passages\./);
  assert.match(result.detail, /reranker ran/);
});

test("one passage is singular", () => {
  const result = verdict(inspection({ chunks: [chunk(1.0, true)] }));
  assert.match(result.headline, /Answered from 1 passage\./);
});

test("a stripped block is called out, because it is the thing worth knowing", () => {
  const result = verdict(
    inspection({
      chunks: [chunk(1.0, true)],
      strips: [{ block_id: "b2", block_type: "fact", reason: "uncited" }],
    }),
  );

  assert.match(result.headline, /1 block was removed by the validator/);
});

test("a reranker that did not run is named, not hidden", () => {
  // §45.3: a quality regression nobody can account for is usually this.
  const result = verdict(
    inspection({
      chunks: [chunk(1.0, true)],
      retrieval: { ...inspection().retrieval, reranked: false },
    }),
  );

  assert.match(result.detail, /reranker did not run/);
});

// ── The answer did not work ─────────────────────────────────────────────────

test("no evidence with no candidates is a retrieval problem, and says so", () => {
  const result = verdict(
    inspection({ turn: { ...inspection().turn, status: "no_evidence" }, chunks: [] }),
  );

  assert.match(result.headline, /found nothing at all/);
  assert.match(result.detail, /Not a reranking problem/);
});

test("no evidence with rejected candidates gives the best score to judge by", () => {
  const result = verdict(
    inspection({
      turn: { ...inspection().turn, status: "no_evidence" },
      chunks: [chunk(0.2, false), chunk(0.05, false)],
    }),
  );

  assert.match(result.headline, /rejected all of them/);
  // The number is the point: 0.200 against a threshold is a decision someone
  // can second-guess, and "it found nothing useful" is not.
  assert.match(result.detail, /best rejected score was 0\.200/);
});

test("a failed turn surfaces the provider's own error", () => {
  const result = verdict(
    inspection({
      turn: { ...inspection().turn, status: "failed", trace_id: "429 rate limited" },
    }),
  );

  assert.match(result.headline, /failed before it could answer/);
  assert.equal(result.detail, "429 rate limited");
});

test("a failed turn with no recorded reason says that is itself a bug", () => {
  const result = verdict(
    inspection({ turn: { ...inspection().turn, status: "failed", trace_id: null } }),
  );

  assert.match(result.detail, /itself a bug/);
});

test("a turn still marked running is distinguished from one that failed", () => {
  const result = verdict(inspection({ turn: { ...inspection().turn, status: "running" } }));
  assert.match(result.headline, /never finished/);
});

test("a refused turn says nothing was spent on it", () => {
  const result = verdict(inspection({ turn: { ...inspection().turn, status: "refused" } }));
  assert.match(result.headline, /guard rejected/);
  assert.match(result.detail, /No retrieval and no model call/);
});

// ── Formatting ──────────────────────────────────────────────────────────────

test("cost keeps four decimals, because an answer costs a fraction of a rupee", () => {
  // Two decimals would render the entire cost screen as a column of ₹0.00.
  assert.equal(rupees(0.3009), "₹0.3009");
  assert.equal(rupees(0), "₹0.0000");
});

test("counts are grouped", () => {
  assert.equal(count(11771), "11,771");
});

test("a missing timestamp renders as a dash rather than Invalid Date", () => {
  assert.equal(when(null), "—");
});

test("recent times are relative and old ones are absolute", () => {
  const anHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  assert.equal(when(anHourAgo), "1h ago");

  // Past a fortnight "37 days ago" stops being a date anyone can place.
  const longAgo = new Date(Date.now() - 40 * 86_400_000).toISOString();
  assert.match(when(longAgo), /\d{4}/);
});
