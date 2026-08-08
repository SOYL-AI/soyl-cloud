"use client";

import { ArrowRight, MessageSquareText, Sparkles, User, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { RevealGroup } from "@/components/ui/Reveal";
import { Container } from "@/components/ui/Container";

const STEPS = [
  { 
    title: "1. Tell us about your hotel", 
    desc: "Have a quick, natural conversation about your property size and operational bottlenecks." 
  },
  { 
    title: "2. Get an instant read", 
    desc: "Our AI analyzes your inputs against industry benchmarks to identify exactly where your team loses time." 
  },
  { 
    title: "3. See your personalized roadmap", 
    desc: "Discover which AI solutions will actually move the needle for your specific challenges." 
  },
];

export function AdvisorTeaser() {
  return (
    <section
      id="advisor"
      className="relative overflow-hidden border-y border-charcoal/10 bg-cream py-16 sm:py-24"
    >
      <Container>
        <RevealGroup className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative z-10">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-soyl-mint-dark)]">
              <Sparkles className="h-3.5 w-3.5" /> Free Operational Audit
            </p>
            <h2 className="text-3xl font-bold leading-tight text-charcoal sm:text-4xl text-balance">
              Stop guessing where you're losing money. Ask the AI.
            </h2>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-charcoal/70">
              Skip the sales calls. Have a 3-turn conversation with our AI Hotel Advisor and get an immediate, personalized read on your operations and what you can automate today.
            </p>

            <div className="mt-8 space-y-6">
              {STEPS.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)] font-bold text-sm">
                      {idx + 1}
                    </div>
                    {idx !== STEPS.length - 1 && (
                      <div className="w-px h-full bg-charcoal/10 mt-2"></div>
                    )}
                  </div>
                  <div className="pb-2">
                    <h3 className="text-[15px] font-bold text-charcoal">{step.title}</h3>
                    <p className="mt-1 text-[14px] text-charcoal/65 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <PremiumCTA />
          </div>

          <div className="relative">
            <ChatPreview />
          </div>
        </RevealGroup>
      </Container>
    </section>
  );
}

function PremiumCTA() {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Link
        href="/advisor"
        className="group relative inline-flex items-center gap-2.5 rounded-xl bg-[var(--color-soyl-charcoal)] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[var(--color-soyl-charcoal)]/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
      >
        <MessageSquareText className="h-4.5 w-4.5 text-[var(--color-soyl-mint)]" aria-hidden />
        <span>Chat with the Hotel Advisor</span>
        <ArrowRight
          className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1.5"
          aria-hidden
        />
      </Link>
      <span className="text-sm font-semibold text-charcoal/60 bg-white/60 px-3.5 py-2 rounded-xl border border-charcoal/10 shadow-sm">
        ⚡ Free · No signup required
      </span>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Premium Glassmorphism Background Blobs */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-mint/30 mix-blend-multiply blur-3xl filter" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-blue-300/20 mix-blend-multiply blur-3xl filter" />
      <div className="pointer-events-none absolute right-0 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-indigo-300/20 mix-blend-multiply blur-3xl filter" />

      {/* Glass Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 rounded-3xl border border-white/60 bg-white/60 p-5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-6 space-y-6"
      >
        {/* User Message */}
        <div className="flex justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, originX: 1, originY: 1 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.4 }}
            className="rounded-2xl rounded-br-md bg-charcoal px-4 py-3 text-[14px] font-medium text-white shadow-md max-w-[85%]"
          >
            We have 150 rooms and our front desk is constantly overwhelmed with routine guest questions.
          </motion.div>
        </div>

        {/* AI Response */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex gap-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint/30 shadow-sm">
            <Sparkles className="h-4 w-4 text-charcoal" />
          </div>
          <div className="rounded-2xl rounded-tl-md bg-white border border-charcoal/5 p-4 shadow-sm space-y-4 max-w-[90%]">
            <p className="text-[14px] leading-relaxed text-charcoal">
              Based on your profile, here is an operational read. Manual guest inquiries are consuming an estimated 14 hours per week of your front desk bandwidth.
            </p>
            
            <div className="rounded-xl border border-charcoal/10 bg-gray-50 p-3 space-y-2">
               <h4 className="text-[12px] font-bold text-charcoal uppercase tracking-wider">Suggested Solution</h4>
               <div className="flex items-center justify-between rounded-lg bg-white p-2.5 shadow-sm border border-charcoal/5">
                 <div>
                   <p className="text-[13px] font-bold text-charcoal">Butler AI</p>
                   <p className="text-[11px] text-charcoal/60 mt-0.5">Automates 75%+ of routine queries</p>
                 </div>
                 <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                   HIGH MATCH
                 </span>
               </div>
            </div>
            
            <div className="pt-1 flex items-center gap-1.5">
               <Zap className="h-3.5 w-3.5 text-amber-500" />
               <span className="text-[11px] font-semibold text-charcoal/50 uppercase tracking-wider">Analysis Complete</span>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
