"use client";

import { ArrowRight, BookOpen, MessageSquareText, Quote, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import { RevealGroup } from "@/components/ui/Reveal";
import { Container } from "@/components/ui/Container";

const STEPS = [
  { icon: Search, label: "It searches your documents" },
  { icon: Quote, label: "It quotes the exact passage" },
  { icon: BookOpen, label: "You check the source in one click" },
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/45">
              Hotel Advisor
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-charcoal sm:text-4xl">
              Your SOPs can answer questions.
              <br className="hidden sm:block" /> Right now they just sit there.
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-charcoal/65">
              Every hotel already has the answers written down. The cost is not
              that nobody wrote them — it is that finding them takes ten minutes
              and a phone call.
            </p>

            <ul className="mt-6 space-y-3">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.label} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint/25">
                      <Icon className="h-4 w-4 text-charcoal" aria-hidden />
                    </span>
                    <span className="text-[15px] text-charcoal/75">{step.label}</span>
                  </li>
                );
              })}
            </ul>

            <PremiumCTA />
          </div>

          <div className="relative">
            <AnswerPreview />
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
        className="group relative inline-flex items-center gap-2.5 rounded-xl bg-[var(--color-soyl-charcoal)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[var(--color-soyl-charcoal)]/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
      >
        <MessageSquareText className="h-4 w-4 text-[var(--color-soyl-mint)]" aria-hidden />
        <span>Chat with the Hotel Advisor</span>
        <ArrowRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        />
      </Link>
      <span className="text-sm font-medium text-charcoal/60 bg-white/60 px-3 py-1.5 rounded-lg border border-charcoal/10">
        ⚡ Free · No signup required
      </span>
    </div>
  );
}

function AnimatedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <motion.span
      custom={delay}
      variants={{
        hidden: { opacity: 1 },
        visible: (d: number) => ({
          opacity: 1,
          transition: {
            delayChildren: d,
            staggerChildren: 0.05,
          },
        }),
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span key={i} className="inline-flex">
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { 
                opacity: 1, 
                y: 0, 
                transition: { duration: 0.4, ease: "easeOut" } 
              },
            }}
            className="inline-block"
            aria-hidden="true"
          >
            {word}
          </motion.span>
          {i < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </motion.span>
  );
}

function AnswerPreview() {
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
        className="relative z-10 rounded-3xl border border-white/60 bg-white/50 p-5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-6"
      >
        <div className="mb-5 flex justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, originX: 1, originY: 1 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring", bounce: 0.4 }}
            className="rounded-2xl rounded-br-md bg-charcoal px-4 py-2 text-sm font-medium text-white shadow-md"
          >
            Can a corporate guest cancel free the day before?
          </motion.div>
        </div>

        <div className="space-y-3">
          <p className="text-[15px] font-semibold leading-snug text-charcoal">
            <AnimatedText 
              text="No — inside 48 hours one night is charged to the company account." 
              delay={1.0}
            />
          </p>

          <p className="text-sm leading-relaxed text-charcoal/80">
            <AnimatedText 
              text="The window is measured from 14:00 on the arrival date, so a booking withdrawn the previous evening falls inside it." 
              delay={2.0}
            />
          </p>
        </div>

        <motion.figure
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 3.5, duration: 0.6, type: "spring", bounce: 0.3 }}
          className="mt-5 rounded-2xl border border-charcoal/10 bg-white/70 p-4 shadow-sm backdrop-blur-md"
        >
          <Quote className="mb-2 h-3.5 w-3.5 text-charcoal/40" aria-hidden />
          <blockquote className="text-[13px] leading-relaxed text-charcoal/75">
            &ldquo;A room booked under a corporate contracted rate may be withdrawn
            without charge up to 48 hours before the arrival date.&rdquo;
          </blockquote>
          <figcaption className="mt-3 border-t border-charcoal/10 pt-2 text-[11px] font-medium text-charcoal/55">
            Front Office SOP · Cancellation and no-show
          </figcaption>
        </motion.figure>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 4.0, duration: 0.6 }}
          className="mt-4 flex items-center gap-2 border-t border-charcoal/10 pt-3"
        >
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/10 bg-white/60 px-2.5 py-1 text-[11px] font-medium text-charcoal/70 shadow-sm backdrop-blur-sm">
            <BookOpen className="h-3 w-3" aria-hidden />1 source
          </span>
          <span className="text-[11px] text-charcoal/45">
            Live generative response
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
