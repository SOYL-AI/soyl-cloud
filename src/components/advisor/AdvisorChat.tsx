"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Lock, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

/**
 * The public Hotel Advisor.
 *
 * A visitor answers five questions and gets a read on their own situation
 * before creating an account.
 *
 * **It is not the product, and it does not pretend to be.** The product answers
 * from documents you upload, with a citation on every claim. This has no
 * documents, so it makes no claims it could not trace to something the visitor
 * just typed — and it says so, in the interface, rather than only in our
 * heads. The line between "what you told us" and "what your documents say" is
 * the whole promise, and blurring it here to make the demo feel more impressive
 * would undermine the thing being demonstrated.
 *
 * Presented as a conversation because that is what it is, but the answers are
 * chips rather than free text for the first four steps. A blank box on a
 * landing page asks a stranger to compose something, which most people decline
 * to do.
 */

type Question = {
  key: string;
  prompt: string;
  options: string[];
};

type Block = {
  type: string;
  title: string | null;
  markdown: string | null;
  level: string | null;
  items: string[];
};

type Insight = {
  headline: string;
  blocks: Block[];
};

const QUESTIONS: Question[] = [
  {
    key: "property_type",
    prompt: "What kind of property do you run?",
    options: [
      "Independent hotel",
      "Small group (2-10 properties)",
      "Resort",
      "Serviced apartments",
      "Boutique / heritage",
    ],
  },
  {
    key: "rooms",
    prompt: "Roughly how many rooms in total?",
    options: ["Under 25", "25-60", "60-150", "150-400", "More than 400"],
  },
  {
    key: "team",
    prompt: "How many people would be asking questions of your documents?",
    options: ["Just me", "2-5", "6-20", "More than 20"],
  },
  {
    key: "pain",
    prompt: "What takes the most time that probably shouldn't?",
    options: [
      "Answering the same staff questions repeatedly",
      "Finding the right clause in a contract",
      "Training new staff on our procedures",
      "Keeping SOPs current across properties",
      "Something else",
    ],
  },
  {
    key: "detail",
    prompt: "Anything specific you'd want it to answer on day one?",
    options: [],
  },
];

export function AdvisorChat() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [detail, setDetail] = useState("");
  const [insight, setInsight] = useState<Insight | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step, insight, pending]);

  const question = QUESTIONS[step];

  async function submit(final: Record<string, string>) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: final }),
      });
      const data = (await response.json()) as { insight?: Insight; message?: string };
      if (response.ok && data.insight) {
        track("Advisor Completed");
        setInsight(data.insight);
      } else {
        setError(data.message ?? "The advisor is unavailable right now.");
      }
    } catch {
      setError("The connection dropped. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  function choose(value: string) {
    if (step === 0) track("Advisor Started");
    const next = { ...answers, [question.key]: value };
    setAnswers(next);

    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      void submit(next);
    }
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setDetail("");
    setInsight(null);
    setError(null);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-3xl border border-charcoal/10 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-charcoal/10 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint/25">
            <Sparkles className="h-4 w-4 text-charcoal" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-charcoal">Hotel Advisor</p>
            <p className="text-[11px] text-charcoal/50">
              A read on your operation. No account needed.
            </p>
          </div>
          {insight || step > 0 ? (
            <button
              onClick={restart}
              className="rounded-lg p-2 text-charcoal/45 transition hover:bg-charcoal/5 hover:text-charcoal"
              aria-label="Start again"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="max-h-[26rem] space-y-4 overflow-y-auto px-5 py-5">
          {QUESTIONS.slice(0, step).map((asked) => (
            <div key={asked.key} className="space-y-2">
              <p className="text-sm text-charcoal/70">{asked.prompt}</p>
              <div className="flex justify-end">
                <p className="inline-flex items-center gap-1.5 rounded-2xl rounded-br-md bg-charcoal px-3.5 py-2 text-sm text-white">
                  <Check className="h-3 w-3" aria-hidden />
                  {answers[asked.key]}
                </p>
              </div>
            </div>
          ))}

          {!insight && !pending ? (
            <motion.div
              key={question.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-sm font-medium text-charcoal">{question.prompt}</p>

              {question.options.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => choose(option)}
                      className="rounded-xl border border-charcoal/15 px-3.5 py-2 text-sm text-charcoal/80 transition hover:border-charcoal/35 hover:bg-mint/10"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    choose(detail.trim() || "Nothing specific");
                  }}
                  className="flex gap-2"
                >
                  <label htmlFor="advisor-detail" className="sr-only">
                    {question.prompt}
                  </label>
                  <input
                    id="advisor-detail"
                    value={detail}
                    onChange={(event) => setDetail(event.target.value)}
                    placeholder="e.g. what our corporate cancellation window is"
                    className="flex-1 rounded-xl border border-charcoal/15 px-3.5 py-2.5 text-sm outline-none transition focus:border-charcoal/30 focus:ring-2 focus:ring-mint/50"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal/90"
                  >
                    Finish
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </form>
              )}
            </motion.div>
          ) : null}

          {pending ? (
            <div className="flex items-center gap-2 py-2 text-sm text-charcoal/55">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Reading what you told us…
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <AnimatePresence>
            {insight ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-[16px] font-semibold leading-snug text-charcoal">
                  {insight.headline}
                </p>

                {insight.blocks.map((block, index) => (
                  <div key={index}>
                    {block.title ? (
                      <h3 className="mb-1.5 text-sm font-semibold text-charcoal">
                        {block.title}
                      </h3>
                    ) : null}

                    {block.type === "list.checklist" ? (
                      <ul className="space-y-1.5">
                        {block.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="flex gap-2 text-sm leading-relaxed text-charcoal/80"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-charcoal/40" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm leading-relaxed text-charcoal/80">
                        {block.markdown}
                      </p>
                    )}
                  </div>
                ))}

                <SignupGate />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div ref={endRef} />
        </div>
      </div>

      {/* Stated plainly rather than buried in a tooltip. The product's claim is
          that it does not make things up; the demo has to hold to the same
          standard or the claim is worth nothing. */}
      <p className="mt-3 px-1 text-center text-[11px] leading-relaxed text-charcoal/45">
        This read is based only on what you just told us. SOYL itself answers from
        your own documents, and cites the passage behind every answer.
      </p>
    </div>
  );
}

/**
 * The upgrade, offered after something useful has already been given.
 *
 * Not a wall. The insight above it is complete, and this says what is different
 * on the other side of signing up — which is a real difference, not a
 * withheld paragraph.
 */
function SignupGate() {
  return (
    <div className="rounded-2xl border border-charcoal/12 bg-mint/[0.12] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-charcoal/60" aria-hidden />
        <p className="text-sm font-semibold text-charcoal">
          Ask this of your own documents
        </p>
      </div>
      <p className="text-sm leading-relaxed text-charcoal/70">
        Upload your SOPs, contracts and policies and ask the same way. Every answer
        quotes the passage it came from — and when nothing covers a question, it
        says so instead of guessing.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 rounded-xl bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-charcoal/90"
        >
          Create an account
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href="/book-demo"
          className="inline-flex items-center rounded-xl border border-charcoal/15 px-4 py-2 text-sm font-medium text-charcoal/80 transition hover:border-charcoal/30"
        >
          Talk to us first
        </Link>
      </div>
    </div>
  );
}
