"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, Lock, RotateCcw, Sparkles, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

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

type ProductSuggestion = {
  product: string;
  reason: string;
  relevance: "high" | "medium" | "low";
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  options?: string[];
  insight?: Insight | null;
  productSuggestions?: ProductSuggestion[] | null;
};

export function AdvisorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const isInsightPhase = messages.some((m) => m.insight);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  useEffect(() => {
    if (messages.length === 0) {
      void fetchChat([], null);
    }
  }, []);

  async function fetchChat(history: Message[], selectedOption: string | null, freeText?: string) {
    setPending(true);
    setError(null);
    try {
      const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));
      
      const response = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, selectedOption }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (history.length === 1 && history[0].role === "user") {
          track("Advisor Chat Started");
        }
        if (data.phase === "insight") {
          track("Advisor Chat Completed");
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: data.message || "",
            options: data.options || [],
            insight: data.insight || null,
            productSuggestions: data.productSuggestions || null,
          }
        ]);
      } else {
        setError(data.message ?? "The advisor is unavailable right now.");
      }
    } catch {
      setError("The connection dropped. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  function handleSend(text: string, isOption: boolean) {
    if (!text.trim() || pending) return;
    
    const userMessage: Message = {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content: text,
    };
    
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue("");
    
    void fetchChat(newHistory, isOption ? text : null, !isOption ? text : undefined);
  }

  function restart() {
    setMessages([]);
    setError(null);
    setInputValue("");
    void fetchChat([], null);
  }

  function getRelevanceColor(relevance: string) {
    if (relevance === "high") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (relevance === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  }
  
  function getProductLink(product: string) {
    const p = product.toLowerCase();
    if (p.includes("butler")) return "/products/butler-ai";
    if (p.includes("pms")) return "/products/pms-lite";
    return "/products";
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex flex-col rounded-3xl border border-charcoal/10 bg-white shadow-xl overflow-hidden h-[36rem]">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b border-charcoal/10 px-6 py-4 bg-gray-50/50 shrink-0">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-mint/25 shadow-sm">
            <Sparkles className="h-4.5 w-4.5 text-charcoal" aria-hidden />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-charcoal">Hotel Advisor AI</p>
            </div>
            <p className="text-[11px] text-charcoal/60">
              Online · Personalized recommendations
            </p>
          </div>
          {messages.length > 1 && (
            <button
              onClick={restart}
              className="flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-charcoal/60 transition hover:bg-charcoal/10 hover:text-charcoal"
              aria-label="Start again"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isLast = index === messages.length - 1;
              
              if (msg.role === "user") {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <p className="inline-flex max-w-[85%] rounded-2xl rounded-br-md bg-charcoal px-4 py-2.5 text-[15px] font-medium text-white shadow-sm">
                      {msg.content}
                    </p>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 max-w-[90%]"
                >
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint/25">
                      <Sparkles className="h-4 w-4 text-charcoal" />
                    </div>
                    <div className="rounded-2xl rounded-tl-md bg-gray-50 border border-gray-100 px-4 py-3 shadow-sm">
                      <p className="text-[15px] leading-relaxed text-charcoal">{msg.content}</p>
                    </div>
                  </div>

                  {msg.options && msg.options.length > 0 && isLast && !pending && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="pl-11 flex flex-wrap gap-2"
                    >
                      {msg.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSend(opt, true)}
                          className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-sm font-medium text-charcoal/80 transition-all hover:border-charcoal/40 hover:bg-mint/15 hover:scale-[1.02] hover:shadow-sm"
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {msg.insight && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="pl-11 space-y-4 mt-2"
                    >
                      <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm space-y-4">
                        <p className="text-base font-bold leading-snug text-charcoal">
                          {msg.insight.headline}
                        </p>
                        
                        {msg.insight.blocks.map((block, bIdx) => (
                          <div key={bIdx}>
                            {block.title && (
                              <h3 className="mb-1.5 text-sm font-semibold text-charcoal">
                                {block.title}
                              </h3>
                            )}
                            {block.type === "list.checklist" ? (
                              <ul className="space-y-1.5">
                                {block.items.map((item, iIdx) => (
                                  <li key={iIdx} className="flex gap-2 text-sm leading-relaxed text-charcoal/80">
                                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-charcoal/40" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : block.type === "alert.callout" ? (
                              <div className="rounded-xl bg-amber-50 p-3 border border-amber-100 text-sm leading-relaxed text-amber-900">
                                {block.markdown}
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed text-charcoal/80">
                                {block.markdown}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {msg.productSuggestions && msg.productSuggestions.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Suggested Solutions</p>
                          <div className="flex flex-col gap-2">
                            {msg.productSuggestions.map((prod, pIdx) => (
                              <Link 
                                key={pIdx} 
                                href={getProductLink(prod.product)}
                                className="group flex items-center justify-between rounded-xl border border-charcoal/10 bg-white p-3 transition hover:border-charcoal/30 hover:shadow-sm"
                              >
                                <div>
                                  <p className="text-sm font-bold text-charcoal group-hover:text-[var(--color-soyl-mint-dark)] transition-colors">{prod.product}</p>
                                  <p className="text-xs text-charcoal/60 mt-0.5">{prod.reason}</p>
                                </div>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRelevanceColor(prod.relevance)}`}>
                                  {prod.relevance.toUpperCase()}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <SignupGate />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {pending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint/25">
                <Sparkles className="h-4 w-4 text-charcoal" />
              </div>
              <div className="flex items-center rounded-2xl rounded-tl-md bg-gray-50 border border-gray-100 px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-5">
                  <motion.div className="w-1.5 h-1.5 bg-charcoal/40 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-1.5 h-1.5 bg-charcoal/40 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.div className="w-1.5 h-1.5 bg-charcoal/40 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-xs font-semibold underline">Dismiss</button>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input Area */}
        {!isInsightPhase && (
          <div className="border-t border-charcoal/10 bg-white p-4 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue, false);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your answer..."
                disabled={pending}
                className="w-full rounded-2xl border border-charcoal/20 bg-gray-50 py-3 pl-4 pr-12 text-[15px] outline-none transition focus:border-charcoal focus:bg-white focus:ring-2 focus:ring-mint/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || pending}
                className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal text-white transition hover:bg-charcoal/90 disabled:opacity-50 disabled:hover:bg-charcoal"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      <p className="mt-3 px-1 text-center text-[11px] leading-relaxed text-charcoal/45">
        This read is based only on what you just told us. SOYL itself answers from
        your own documents, and cites the passage behind every answer.
      </p>
    </div>
  );
}

function SignupGate() {
  return (
    <div className="rounded-2xl border border-charcoal/12 bg-mint/[0.12] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-charcoal/60" aria-hidden />
        <p className="text-sm font-semibold text-charcoal">
          Want to try this with your own documents?
        </p>
      </div>
      <p className="text-sm leading-relaxed text-charcoal/70">
        Upload your SOPs, contracts and policies and ask the same way. Every answer
        quotes the passage it came from — and when nothing covers a question, it
        says so instead of guessing.
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-charcoal/90 shadow-sm"
        >
          Create Account
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href="/book-demo"
          className="inline-flex items-center rounded-xl border border-charcoal/15 bg-white px-4 py-2.5 text-sm font-medium text-charcoal/80 transition hover:border-charcoal/30 hover:bg-gray-50 shadow-sm"
        >
          Talk To Us
        </Link>
      </div>
    </div>
  );
}
