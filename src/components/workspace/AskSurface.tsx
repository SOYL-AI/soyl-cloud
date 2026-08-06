"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  BookOpen,
  Loader2,
  MessageSquareText,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AnswerBlocks } from "@/components/workspace/AnswerBlocks";

import type { AskResponse, Envelope } from "@soyl/contracts";
import { track } from "@/lib/analytics";

/**
 * Asking questions of your own documents.
 *
 * Three things drive the design, and all three are about trust rather than
 * chat:
 *
 * 1. **Sources are one click from every answer, never hidden behind a menu.**
 *    The product's whole claim is that it does not make things up, and a claim
 *    you have to go looking for evidence of is a claim people stop checking and
 *    then stop believing.
 *
 * 2. **A refusal is styled as an answer, not an error.** §9: "Refusal is a
 *    valid, well-designed outcome... and should look deliberate, not like an
 *    error." Red text and a warning triangle would train people to read "I
 *    don't have that" as a malfunction, and the next thing they ask for is a
 *    system that always answers.
 *
 * 3. **Degradation is visible.** When the reranker was skipped or a claim was
 *    stripped, the answer says so quietly. A silently degraded answer is
 *    indistinguishable from a good one until somebody acts on it.
 */

type Exchange = {
  question: string;
  envelope: Envelope | null;
  error: string | null;
  /** What the pipeline is doing right now, while it is doing it. */
  stage: string | null;
};

type Conversation = {
  id: string;
  title: string | null;
  turn_count: number;
  last_turn_at: string | null;
};

type StoredTurn = {
  turn_id: string;
  question: string;
  status: string;
  envelope: Envelope | null;
};

const SUGGESTIONS = [
  "What is our cancellation policy for corporate bookings?",
  "How long do we keep items left behind in a room?",
  "What do I do if a guest reports a fault at midnight?",
];

export function AskSurface({ hasDocuments }: { hasDocuments: boolean }) {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pending, setPending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sourcesFor, setSourcesFor] = useState<Envelope | null>(null);
  const [history, setHistory] = useState<Conversation[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) setHistory((await response.json()) as Conversation[]);
    } catch {
      // The sidebar is incidental to asking a question.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resume(id: string) {
    setSourcesFor(null);
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) return;

      const turns = (await response.json()) as StoredTurn[];
      setConversationId(id);
      setExchanges(
        turns.map((turn) => ({
          question: turn.question,
          envelope: turn.envelope,
          error:
            turn.status === "failed" && !turn.envelope
              ? "This question failed to complete."
              : null,
          stage: null,
        })),
      );
    } catch {
      // Same reasoning as above.
    }
  }

  function startNew() {
    setConversationId(null);
    setExchanges([]);
    setSourcesFor(null);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [exchanges, pending]);

  async function ask(text: string) {
    const asked = text.trim();
    if (!asked || pending) return;

    setQuestion("");
    setPending(true);
    setExchanges((current) => [
      ...current,
      { question: asked, envelope: null, error: null, stage: "Reading your documents" },
    ]);

    function patch(update: Partial<Exchange>) {
      setExchanges((current) => {
        const next = [...current];
        next[next.length - 1] = { ...next[next.length - 1], ...update };
        return next;
      });
    }

    try {
      const response = await fetch("/api/answers/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: asked, conversation_id: conversationId }),
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        patch({
          error: data?.message ?? "We could not answer that just now.",
          stage: null,
        });
        return;
      }

      // Frames are separated by a blank line, and a chunk boundary can land
      // anywhere — including mid-frame — so the tail is carried over rather
      // than parsed and dropped.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const name = frame.match(/^event: (.+)$/m)?.[1];
          const raw = frame.match(/^data: (.+)$/m)?.[1];
          if (!name || !raw) continue;

          const data = JSON.parse(raw) as Record<string, unknown>;

          if (name === "error") {
            patch({ error: String(data.message ?? "Something went wrong."), stage: null });
            return;
          }
          if (name === "layout") {
            patch({ stage: "Writing the answer" });
          }
          if (name === "envelope.complete") {
            const payload = data as unknown as AskResponse;
            patch({ envelope: payload.envelope, stage: null });
            // The envelope's own status, so the funnel can tell an answered
            // question from a refused one without a second query.
            track("Question Asked", { status: payload.envelope.status });
            if (payload.conversation_id) setConversationId(payload.conversation_id);
            void loadHistory();
          }
        }
      }
    } catch {
      patch({
        error: "The connection dropped before the answer arrived.",
        stage: null,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex gap-6">
      {/* Only once there is something to resume. An empty sidebar on a first
          visit is a column of nothing next to the thing they came to use. */}
      {history.length > 0 ? (
        <HistoryList
          conversations={history}
          activeId={conversationId}
          onResume={resume}
          onNew={startNew}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-1 space-y-8 pb-6">
        {exchanges.length === 0 ? (
          <Empty hasDocuments={hasDocuments} onPick={ask} />
        ) : null}

        {exchanges.map((exchange, index) => (
          <Turn
            key={index}
            exchange={exchange}
            pending={pending && index === exchanges.length - 1}
            onShowSources={setSourcesFor}
            onFollowup={ask}
          />
        ))}

        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-charcoal/10 bg-white/85 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask(question);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="ask" className="sr-only">
            Ask a question about your documents
          </label>
          <textarea
            id="ask"
            rows={1}
            value={question}
            disabled={pending}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter breaks the line. A multi-line question
              // is rare and a question sent by accident is annoying, so the
              // common case gets the plain key.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void ask(question);
              }
            }}
            placeholder="Ask anything in your documents…"
            className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-[15px] text-charcoal outline-none transition focus:border-charcoal/30 focus:ring-2 focus:ring-mint/50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={pending || !question.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-charcoal text-white transition hover:bg-charcoal/90 disabled:opacity-40"
            aria-label="Send question"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ArrowUp className="h-4 w-4" aria-hidden />
            )}
          </button>
        </form>
        <p className="mt-2 text-[11px] text-charcoal/45">
          Answers come only from your uploaded documents. If nothing covers a question,
          SOYL says so rather than guessing.
        </p>
      </div>

      </div>

      <SourceDrawer envelope={sourcesFor} onClose={() => setSourcesFor(null)} />
    </div>
  );
}

/**
 * Past conversations.
 *
 * Tenant-wide rather than per-user, matching the API: a duty manager asks
 * something on the late shift and the general manager reads it next morning.
 * In a hotel that hand-off is the normal case.
 *
 * Hidden below `lg` — on a phone the answer is the whole screen, and a
 * navigation column competing with it helps nobody.
 */
function HistoryList({
  conversations,
  activeId,
  onResume,
  onNew,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onResume: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block" aria-label="Past questions">
      <button
        onClick={onNew}
        className="mb-3 flex w-full items-center gap-2 rounded-xl border border-charcoal/15 px-3 py-2 text-sm font-medium text-charcoal/80 transition hover:border-charcoal/30 hover:bg-charcoal/[0.02]"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        New question
      </button>

      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal/40">
        Recent
      </p>

      <ul className="space-y-0.5">
        {conversations.map((conversation) => {
          const active = conversation.id === activeId;
          return (
            <li key={conversation.id}>
              <button
                onClick={() => onResume(conversation.id)}
                aria-current={active ? "true" : undefined}
                className={`w-full rounded-lg px-3 py-2 text-left text-[13px] leading-snug transition ${
                  active
                    ? "bg-mint/25 text-charcoal"
                    : "text-charcoal/65 hover:bg-charcoal/[0.04] hover:text-charcoal"
                }`}
              >
                <span className="line-clamp-2">
                  {conversation.title ?? "Untitled"}
                </span>
                {conversation.turn_count > 1 ? (
                  <span className="mt-0.5 block text-[11px] text-charcoal/40">
                    {conversation.turn_count} questions
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Empty({
  hasDocuments,
  onPick,
}: {
  hasDocuments: boolean;
  onPick: (question: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-charcoal/10 bg-white p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/25">
        <MessageSquareText className="h-5 w-5 text-charcoal" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-charcoal">
        {hasDocuments ? "Ask your documents anything" : "Upload a document first"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-charcoal/65">
        {hasDocuments
          ? "Every answer cites the passage it came from, so you can check it in one click."
          : "SOYL answers from your own SOPs, contracts and policies. Add one and this becomes useful immediately."}
      </p>

      {hasDocuments ? (
        <div className="mt-6 flex flex-col gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onPick(suggestion)}
              className="rounded-xl border border-charcoal/10 px-4 py-2.5 text-left text-sm text-charcoal/75 transition hover:border-charcoal/25 hover:bg-charcoal/[0.02]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : (
        <a
          href="/app/documents"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal/90"
        >
          Add a document
        </a>
      )}
    </div>
  );
}

function Turn({
  exchange,
  pending,
  onShowSources,
  onFollowup,
}: {
  exchange: Exchange;
  pending: boolean;
  onShowSources: (envelope: Envelope) => void;
  onFollowup: (question: string) => void;
}) {
  const { question, envelope, error } = exchange;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-charcoal px-4 py-2.5 text-[15px] text-white">
          {question}
        </p>
      </div>

      {pending && exchange.stage ? (
        <div className="flex items-center gap-2 text-sm text-charcoal/55" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {exchange.stage}…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {envelope ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-charcoal/10 bg-white p-5 sm:p-6"
        >
          {/* The headline is the answer, not a label for it. Rendered first
              and largest because it is what someone mid-shift reads. */}
          <p className="mb-4 text-[17px] font-semibold leading-snug text-charcoal">
            {envelope.summary.headline}
          </p>

          <AnswerBlocks blocks={envelope.blocks} />

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-charcoal/10 pt-4">
            {envelope.provenance.documents.length > 0 ? (
              <button
                onClick={() => onShowSources(envelope)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal/75 transition hover:border-charcoal/30 hover:bg-charcoal/[0.03]"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                {envelope.provenance.documents.length}{" "}
                {envelope.provenance.documents.length === 1 ? "source" : "sources"}
              </button>
            ) : null}

            {envelope.diagnostics.degraded ? (
              <Degraded envelope={envelope} />
            ) : null}
          </div>

          {envelope.followups.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {envelope.followups.map((followup) => (
                <button
                  key={followup}
                  onClick={() => onFollowup(followup)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/12 px-3 py-1.5 text-xs text-charcoal/70 transition hover:border-charcoal/25 hover:bg-mint/10"
                >
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {followup}
                </button>
              ))}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}

/**
 * What went wrong, or nearly did.
 *
 * Small and grey rather than a banner: the answer is still real, and shouting
 * about a skipped reranker would make a usable answer look broken. But it is
 * present, because an answer that degraded silently is one nobody can explain
 * afterwards.
 */
function Degraded({ envelope }: { envelope: Envelope }) {
  const stripped = envelope.diagnostics.stripped_blocks;

  return (
    <span className="text-xs text-charcoal/45" title={envelope.diagnostics.warnings.join("\n")}>
      {stripped > 0
        ? `${stripped} unsupported ${stripped === 1 ? "claim was" : "claims were"} removed`
        : "Answered in a degraded mode"}
    </span>
  );
}

function SourceDrawer({
  envelope,
  onClose,
}: {
  envelope: Envelope | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!envelope) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [envelope, onClose]);

  return (
    <AnimatePresence>
      {envelope ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-charcoal/30 backdrop-blur-sm"
            aria-hidden
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            role="dialog"
            aria-label="Sources for this answer"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-charcoal/10 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-charcoal">Sources</h2>
                <p className="text-xs text-charcoal/55">
                  The passages this answer was built from
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-charcoal/50 transition hover:bg-charcoal/5 hover:text-charcoal"
                aria-label="Close sources"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {envelope.provenance.documents.map((source) => (
                <div
                  key={source.id}
                  className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.02] p-4"
                >
                  <p className="text-xs font-semibold text-charcoal">
                    {source.document_title}
                  </p>
                  {source.heading_path.length ? (
                    <p className="mt-0.5 text-[11px] text-charcoal/50">
                      {source.heading_path.join(" › ")}
                    </p>
                  ) : null}
                  <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-charcoal/75">
                    {source.excerpt}
                  </p>
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
