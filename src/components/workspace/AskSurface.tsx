"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  BookOpen,
  Loader2,
  MessageSquareText,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AnswerBlocks } from "@/components/workspace/AnswerBlocks";

import type { AskResponse, Envelope } from "@soyl/contracts";

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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [exchanges, pending]);

  async function ask(text: string) {
    const asked = text.trim();
    if (!asked || pending) return;

    setQuestion("");
    setPending(true);
    setExchanges((current) => [...current, { question: asked, envelope: null, error: null }]);

    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: asked, conversation_id: conversationId }),
      });

      const data = (await response.json()) as AskResponse & { message?: string };

      setExchanges((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (response.ok && data.envelope) {
          next[next.length - 1] = { ...last, envelope: data.envelope };
        } else {
          next[next.length - 1] = {
            ...last,
            error: data.message ?? "We could not answer that just now.",
          };
        }
        return next;
      });

      if (response.ok && data.conversation_id) setConversationId(data.conversation_id);
    } catch {
      setExchanges((current) => {
        const next = [...current];
        next[next.length - 1] = {
          ...next[next.length - 1],
          error: "The connection dropped before the answer arrived.",
        };
        return next;
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
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

      <SourceDrawer envelope={sourcesFor} onClose={() => setSourcesFor(null)} />
    </div>
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

      {pending ? (
        <div className="flex items-center gap-2 text-sm text-charcoal/55">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Reading your documents…
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
