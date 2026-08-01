import Link from "next/link";

import { AdminShell, StatusPill, Table, Td, Th } from "@/components/admin/Shell";
import {
  adminFetch,
  count,
  rupees,
  verdict,
  type Inspection,
  type InspectorChunk,
} from "@/lib/admin";

/**
 * The answer inspector (`UPDATE.md` §11, handbook §27.3).
 *
 * This screen is the milestone. §12's acceptance criterion is that you can
 * open any answer here and explain in under a minute why it said what it said,
 * and the layout is built backwards from that sentence:
 *
 * 1. **The verdict, in words, first.** Everything below it is evidence for a
 *    claim already made. A screen that opens with a JSON blob makes the reader
 *    do the diagnosis, which is the minute we are trying not to spend.
 * 2. **Rejected chunks beside kept ones.** M4 learned within an hour that
 *    "we found it and scored it 0.20" and "we never found it" are different
 *    bugs. Showing only what survived hides which one you have.
 * 3. **Draft, strips and envelope in that order** — what the model said, what
 *    the validator removed, what the customer saw. Read top to bottom, that is
 *    the causal chain.
 *
 * Server-rendered with no client JavaScript. `<details>` does the collapsing.
 */

function ChunkCard({ chunk }: { chunk: InspectorChunk }) {
  return (
    <details
      className={`rounded border px-3 py-2 ${
        chunk.kept ? "border-emerald-200 bg-emerald-50/40" : "border-neutral-200 bg-neutral-50/60"
      }`}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-sm tabular-nums">{chunk.score.toFixed(4)}</span>
          <span className="text-sm font-medium">{chunk.document_title ?? "(deleted document)"}</span>
          <span className="text-xs text-neutral-500">
            {chunk.heading_path.length > 0 ? chunk.heading_path.join(" › ") : "no heading path"}
            {chunk.token_count === null ? "" : ` · ${count(chunk.token_count)} tokens`}
          </span>
          <span
            className={`ml-auto rounded px-1.5 py-0.5 text-xs ring-1 ring-inset ${
              chunk.kept
                ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                : "bg-neutral-100 text-neutral-600 ring-neutral-300"
            }`}
          >
            {chunk.kept ? "used" : "rejected"}
          </span>
        </div>
      </summary>
      <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-white p-2 text-xs leading-relaxed text-neutral-800">
        {chunk.content}
      </pre>
      <p className="mt-1 font-mono text-[11px] text-neutral-400">{chunk.chunk_id}</p>
    </details>
  );
}

function Json({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="rounded border border-neutral-200">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">{label}</summary>
      <pre className="max-h-[32rem] overflow-auto border-t border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed">
        {value === null || value === undefined ? "null" : JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

export default async function InspectorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await adminFetch<Inspection>(`/v1/admin/turns/${id}`);
  const { turn, retrieval, chunks, strips, usage, feedback } = data;
  const answer = verdict(data);

  const kept = chunks.filter((chunk) => chunk.kept);
  const rejected = chunks.filter((chunk) => !chunk.kept);

  return (
    <AdminShell
      title="Answer inspector"
      actions={
        <Link
          href={`/admin/questions?tenant_id=${turn.tenant_id}`}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          This tenant&rsquo;s questions
        </Link>
      }
    >
      {/* ── The question ─────────────────────────────────────────────── */}
      <section className="mb-5 rounded border border-neutral-200 p-4">
        <p className="text-lg font-medium">{turn.question}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
          <StatusPill status={turn.status} />
          <span>
            <Link
              href={`/admin/tenants/${turn.tenant_id}`}
              className="underline-offset-4 hover:underline"
            >
              {turn.tenant_name}
            </Link>
            {turn.user_email ? ` · ${turn.user_email}` : ""}
          </span>
          <span>{new Date(turn.asked_at).toLocaleString("en-IN")}</span>
          {turn.latency_ms === null ? null : <span>{count(turn.latency_ms)}ms</span>}
          <span>{rupees(turn.cost_inr)}</span>
          <span className="font-mono text-xs text-neutral-400">{turn.turn_id}</span>
        </div>
      </section>

      {/* ── The verdict ──────────────────────────────────────────────── */}
      <section className="mb-6 rounded border-l-4 border-l-[#1C1C1C] bg-neutral-50 px-4 py-3">
        <p className="font-medium">{answer.headline}</p>
        <p className="mt-1 text-sm text-neutral-700">{answer.detail}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          {/* ── Retrieval ──────────────────────────────────────────── */}
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Retrieval
            </h2>
            <dl className="mb-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-neutral-500">Query</dt>
                <dd className="break-words">{retrieval.query ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Reranked</dt>
                <dd>{retrieval.reranked ? "yes" : "no — fusion order"}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Kept / rejected</dt>
                <dd className="tabular-nums">
                  {count(retrieval.kept)} / {count(retrieval.rejected)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">Took</dt>
                <dd className="tabular-nums">
                  {retrieval.latency_ms === null ? "—" : `${count(retrieval.latency_ms)}ms`}
                </dd>
              </div>
            </dl>

            {Object.keys(retrieval.filters).length > 0 ? (
              <p className="mb-3 text-xs text-neutral-500">
                {/* A retrieval that found nothing is usually explained by a
                    filter, so it is shown rather than hidden behind a toggle. */}
                Scope: <code>{JSON.stringify(retrieval.filters)}</code>
              </p>
            ) : null}

            {chunks.length === 0 ? (
              <p className="rounded border border-dashed border-neutral-300 px-3 py-6 text-center text-sm text-neutral-500">
                No retrieval was logged for this turn.
              </p>
            ) : (
              <div className="space-y-2">
                {kept.map((chunk) => (
                  <ChunkCard key={chunk.chunk_id} chunk={chunk} />
                ))}
                {rejected.length > 0 ? (
                  <>
                    <p className="pt-2 text-xs uppercase tracking-wide text-neutral-500">
                      Rejected — found, scored, and dropped below the threshold
                    </p>
                    {rejected.map((chunk) => (
                      <ChunkCard key={chunk.chunk_id} chunk={chunk} />
                    ))}
                  </>
                ) : null}
              </div>
            )}
          </section>

          {/* ── Model output and validation ────────────────────────── */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Synthesis
            </h2>

            {strips.length > 0 ? (
              <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <p className="font-medium text-amber-900">
                  The validator removed {count(strips.length)}{" "}
                  {strips.length === 1 ? "block" : "blocks"}.
                </p>
                <ul className="mt-1 space-y-0.5 text-amber-900/90">
                  {strips.map((strip, index) => (
                    <li key={`${strip.block_id}-${index}`}>
                      <code>{strip.block_type ?? "block"}</code> — {strip.reason ?? "no reason"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Json label="Raw model output (before validation)" value={data.draft} />
            <Json label="Envelope (what the customer saw)" value={data.envelope} />
          </section>
        </div>

        {/* ── Money and feedback ──────────────────────────────────── */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              What it cost
            </h2>
            {usage.length === 0 ? (
              <p className="text-sm text-neutral-500">Nothing was billed for this turn.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Call</Th>
                    <Th right>Tokens</Th>
                    <Th right>Cost</Th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((row, index) => (
                    <tr key={`${row.model}-${index}`}>
                      <Td>
                        <div>{row.kind}</div>
                        <div className="text-xs text-neutral-500">{row.model ?? "—"}</div>
                      </Td>
                      <Td right muted>
                        {count(row.input_tokens)} in / {count(row.output_tokens)} out
                      </Td>
                      <Td right>{rupees(row.cost_inr)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Feedback
            </h2>
            {feedback.length === 0 ? (
              <p className="text-sm text-neutral-500">Nobody rated this answer.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {feedback.map((item, index) => (
                  <li key={index} className="rounded border border-neutral-200 px-3 py-2">
                    <span className="font-medium">{item.signal}</span>
                    {item.reasons.length > 0 ? ` · ${item.reasons.join(", ")}` : ""}
                    {/* The highest-value field on the screen: a correction is a
                        labelled eval example somebody typed for us voluntarily. */}
                    {item.correction ? (
                      <p className="mt-1 text-neutral-700">“{item.correction}”</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
