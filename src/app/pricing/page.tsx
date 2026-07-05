"use client";

import React, { useState } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Check, ChevronDown, Sparkles, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const butlerFeatures = [
  { name: "Chat concierge", tiers: ["✓", "✓", "✓"] },
  { name: "QR system", tiers: ["✓", "✓", "✓"] },
  { name: "Guest service requests", tiers: ["✓", "✓", "✓"] },
  { name: "Guest feedback", tiers: ["Basic", "Full", "Full"] },
  { name: "SOS / security", tiers: ["✓", "✓", "✓"] },
  { name: "Ops dashboard", tiers: ["✗", "✓", "✓"] },
  { name: "Upsell engine", tiers: ["✗", "Rule-based", "AI-driven"] },
  { name: "Voice AI (outbound + in-app)", tiers: ["✗", "✗", "✓"] },
  { name: "Pre check-in calls", tiers: ["✗", "✗", "✓"] },
  { name: "Included voice minutes", tiers: ["✗", "✗", "30 min/room"] },
  { name: "Priority support", tiers: ["✗", "✗", "✓"] },
];

const faqs = [
  {
    question: "How does the 1-month free trial work?",
    answer: "Every property receives a 1-month free trial on entry with full access to the features in your selected tier. No credit card is required upfront. You will only be billed if you decide to continue after the trial.",
  },
  {
    question: "What is the minimum commitment?",
    answer: "After the trial, there is a minimum 3-month prepaid commitment. Billing is processed quarterly, in advance.",
  },
  {
    question: "What happens if we exceed the voice AI limits?",
    answer: "The Butler tier includes 30 minutes of AI voice per room per month. Any voice usage beyond the included monthly limit is metered at ₹10 per minute, billed in whole-minute increments.",
  },
  {
    question: "Can I use Butler AI without PMS Lite?",
    answer: "Absolutely. SOYL Cloud is modular. You can use Butler AI alongside your existing PMS, or adopt PMS Lite independently. Bundling them provides the best integrated experience.",
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="flex min-h-screen flex-col pt-24 pb-16 bg-[var(--color-soyl-white)]">
      <Container size="lg">
        {/* HERO */}
        <section className="pt-16 pb-20 md:pt-24 md:pb-28 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--gradient-glow)] -z-10 pointer-events-none" />
          <Badge variant="primary" className="mb-6 mx-auto inline-flex">Pricing</Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-[var(--color-soyl-gray-600)] max-w-2xl mx-auto">
            Choose what your property needs. Pay per room for Butler AI, or a flat fee for PMS Lite.
          </p>
        </section>

        {/* BUTLER AI */}
        <section className="py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)] mb-6">
              <Sparkles size={32} />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-soyl-charcoal)] mb-4">Butler AI</h2>
            <p className="text-lg text-[var(--color-soyl-gray-600)] max-w-xl mx-auto">
              The AI guest-experience layer. Priced <strong>per room per month</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch mb-20">
            {/* Starter */}
            <div className="bg-white rounded-3xl p-8 border border-[var(--color-soyl-gray-200)] shadow-sm flex flex-col">
              <h3 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-2">Starter</h3>
              <p className="text-sm text-[var(--color-soyl-gray-500)] mb-6 h-10">Essential digital concierge</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-[var(--color-soyl-charcoal)]">₹199</span>
                <span className="text-[var(--color-soyl-gray-500)]"> / room</span>
              </div>
              <ul className="flex flex-col gap-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-[var(--color-soyl-gray-600)]"><Check size={20} className="text-[var(--color-soyl-mint-dark)] shrink-0" /> Chat concierge & QR system</li>
                <li className="flex items-start gap-3 text-sm text-[var(--color-soyl-gray-600)]"><Check size={20} className="text-[var(--color-soyl-mint-dark)] shrink-0" /> Guest service requests</li>
                <li className="flex items-start gap-3 text-sm text-[var(--color-soyl-gray-600)]"><Check size={20} className="text-[var(--color-soyl-mint-dark)] shrink-0" /> SOS & security alerts</li>
              </ul>
              <Button variant="outline" size="lg" href="/contact" className="w-full">Start Free Trial</Button>
            </div>

            {/* Core */}
            <div className="bg-white rounded-3xl p-8 border border-[var(--color-soyl-gray-200)] shadow-sm flex flex-col">
              <h3 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-2">Core</h3>
              <p className="text-sm text-[var(--color-soyl-gray-500)] mb-6 h-10">Advanced operations & dashboards</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-[var(--color-soyl-charcoal)]">₹299</span>
                <span className="text-[var(--color-soyl-gray-500)]"> / room</span>
              </div>
              <ul className="flex flex-col gap-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-[var(--color-soyl-gray-600)]"><Check size={20} className="text-[var(--color-soyl-mint-dark)] shrink-0" /> Everything in Starter</li>
                <li className="flex items-start gap-3 text-sm text-[var(--color-soyl-gray-600)]"><Check size={20} className="text-[var(--color-soyl-mint-dark)] shrink-0" /> Live Ops Dashboard</li>
                <li className="flex items-start gap-3 text-sm text-[var(--color-soyl-gray-600)]"><Check size={20} className="text-[var(--color-soyl-mint-dark)] shrink-0" /> Rule-based upsell engine</li>
                <li className="flex items-start gap-3 text-sm text-[var(--color-soyl-gray-600)]"><Check size={20} className="text-[var(--color-soyl-mint-dark)] shrink-0" /> Full guest feedback</li>
              </ul>
              <Button variant="outline" size="lg" href="/contact" className="w-full">Start Free Trial</Button>
            </div>

            {/* Butler */}
            <div className="relative rounded-3xl p-[2px] bg-[var(--gradient-mint)] shadow-2xl flex flex-col transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--color-soyl-charcoal)] text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md z-10 whitespace-nowrap">
                Most Popular
              </div>
              <div className="bg-[var(--color-soyl-charcoal)] rounded-[22px] p-8 flex flex-col h-full text-white">
                <h3 className="text-2xl font-bold mb-2">Butler</h3>
                <p className="text-sm text-gray-400 mb-6 h-10">Full AI voice & proactive service</p>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-white">₹499</span>
                  <span className="text-gray-400"> / room</span>
                </div>
                <ul className="flex flex-col gap-4 mb-8 flex-1">
                  <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={20} className="text-[var(--color-soyl-mint)] shrink-0" /> Everything in Core</li>
                  <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={20} className="text-[var(--color-soyl-mint)] shrink-0" /> AI Voice (outbound & in-app)</li>
                  <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={20} className="text-[var(--color-soyl-mint)] shrink-0" /> Pre check-in calls</li>
                  <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={20} className="text-[var(--color-soyl-mint)] shrink-0" /> AI-driven upsell engine</li>
                  <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={20} className="text-[var(--color-soyl-mint)] shrink-0" /> Priority support</li>
                </ul>
                <Button variant="primary" size="lg" href="/book-demo" className="w-full bg-[var(--color-soyl-mint)] text-[var(--color-soyl-charcoal)] hover:bg-[var(--color-soyl-mint-light)]">Book a Demo</Button>
              </div>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="max-w-5xl mx-auto mt-24 overflow-hidden border border-[var(--color-soyl-gray-200)] rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-soyl-gray-50)] border-b border-[var(--color-soyl-gray-200)]">
                    <th className="py-4 px-6 font-semibold text-[var(--color-soyl-charcoal)] w-2/5 text-sm uppercase tracking-wider">Feature Compare</th>
                    <th className="py-4 px-6 font-semibold text-[var(--color-soyl-charcoal)] text-center text-sm uppercase tracking-wider">Starter</th>
                    <th className="py-4 px-6 font-semibold text-[var(--color-soyl-charcoal)] text-center text-sm uppercase tracking-wider">Core</th>
                    <th className="py-4 px-6 font-semibold text-[var(--color-soyl-mint-dark)] text-center text-sm uppercase tracking-wider">Butler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-soyl-gray-100)]">
                  {butlerFeatures.map((f, i) => (
                    <tr key={i} className="hover:bg-[var(--color-soyl-gray-50)] transition-colors">
                      <td className="py-4 px-6 text-sm text-[var(--color-soyl-charcoal)] font-medium">{f.name}</td>
                      {f.tiers.map((tier, idx) => (
                        <td key={idx} className={`py-4 px-6 text-sm text-center ${tier === '✗' ? 'text-[var(--color-soyl-gray-400)]' : tier === '✓' ? 'text-[var(--color-soyl-mint-dark)] font-bold' : 'text-[var(--color-soyl-gray-600)] font-medium'}`}>
                          {tier}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* PMS LITE */}
        <section className="py-24 border-t border-[var(--color-soyl-gray-200)] mt-8">
          <div className="flex flex-col md:flex-row gap-16 items-center max-w-5xl mx-auto">
            <div className="flex-1 text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-soyl-gray-100)] text-[var(--color-soyl-charcoal)] mb-6">
                <Building2 size={32} />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-soyl-charcoal)] mb-6">PMS Lite</h2>
              <p className="text-lg text-[var(--color-soyl-gray-600)] mb-8 leading-relaxed max-w-lg">
                The property-management backbone. A simple, flat monthly fee for any size of hotel. Perfect for streamlining your operations.
              </p>
              <ul className="flex flex-col gap-4 mb-8">
                {["Check-in and check-out management", "Folio & customer profiles", "Revenue management & night audit", "Real-time inventory control"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[var(--color-soyl-charcoal)] font-medium">
                    <Check size={20} className="text-[var(--color-soyl-mint-dark)]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="w-full max-w-sm shrink-0">
              <div className="bg-[var(--color-soyl-charcoal)] text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-soyl-mint)] opacity-10 rounded-bl-full" />
                <h3 className="text-2xl font-bold mb-2">Flat Rate</h3>
                <p className="text-[var(--color-soyl-gray-400)] text-sm mb-6">Unlimited rooms, all features</p>
                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-[var(--color-soyl-mint)]">₹9,999</span>
                  <span className="text-[var(--color-soyl-gray-400)] block mt-2 text-sm">per property / month</span>
                </div>
                
                <div className="border-t border-white/10 pt-6 mt-6 mb-8">
                  <h4 className="font-semibold text-xs mb-3 uppercase tracking-wider text-gray-400">Optional Add-on</h4>
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                    <span className="text-sm font-medium">Channel Manager</span>
                    <span className="text-sm font-bold text-[var(--color-soyl-mint)]">₹3,999/mo onwards</span>
                  </div>
                </div>
                
                <Button variant="primary" size="lg" href="/book-demo" className="w-full bg-white text-[var(--color-soyl-charcoal)] hover:bg-[var(--color-soyl-gray-100)]">Book PMS Demo</Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-24 border-t border-[var(--color-soyl-gray-200)] max-w-3xl mx-auto">
          <SectionHeader title="Frequently Asked Questions" align="center" className="mb-12" />
          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <FaqItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
          <div className="mt-16 text-center">
            <p className="text-[var(--color-soyl-gray-600)] mb-6 text-lg">Not sure which plan is right for your property?</p>
            <Button variant="secondary" size="lg" href="/book-demo">Book a call and we'll help you choose</Button>
          </div>
        </section>

      </Container>
    </main>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-[var(--color-soyl-gray-200)] rounded-2xl overflow-hidden bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="font-semibold text-[var(--color-soyl-charcoal)] text-lg">{question}</span>
        <ChevronDown className={`shrink-0 transition-transform duration-300 text-[var(--color-soyl-gray-400)] ${isOpen ? "rotate-180" : ""}`} size={20} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 pt-2 text-[var(--color-soyl-gray-600)] leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
