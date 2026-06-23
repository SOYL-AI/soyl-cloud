"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Info, Plus, PhoneCall, Sparkles, Building2, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const butlerFeatures = [
  { name: "Chat concierge", tiers: ["✓", "✓", "✓"] },
  { name: "QR system", tiers: ["✓", "✓", "✓"] },
  { name: "Hotel services listing", tiers: ["✓", "✓", "✓"] },
  { name: "Guest service requests", tiers: ["✓", "✓", "✓"] },
  { name: "Guest feedback", tiers: ["Basic", "Full", "Full"] },
  { name: "SOS / security", tiers: ["✓", "✓", "✓"] },
  { name: "Ops dashboard", tiers: ["✗", "✓", "✓"] },
  { name: "Upsell engine", tiers: ["✗", "Rule-based", "AI-driven"] },
  { name: "Voice AI (outbound + in-app)", tiers: ["✗", "✗", "✓"] },
  { name: "Pre check-in calls (multilingual)", tiers: ["✗", "✗", "✓"] },
  { name: "Staff management", tiers: ["✗", "✗", "✓"] },
  { name: "Operations management", tiers: ["✗", "✗", "✓"] },
  { name: "Cab + tourist guide support", tiers: ["✗", "✗", "✓"] },
  { name: "Included voice minutes", tiers: ["✗", "✗", "✓"] },
  { name: "Priority support", tiers: ["✗", "✗", "✓"] },
  { name: "Onboarding / setup", tiers: ["Standard", "Standard", "Free"] },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col bg-white">
      {/* ─── HERO ─────────────────────────────────────── */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-mint)_0%,_transparent_70%)] opacity-10 -z-10" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 mb-6 shadow-sm">
              <span className="text-[var(--color-mint-dark)]">Simple, transparent pricing</span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-charcoal)] leading-[1.1] mb-6">
              Pick what your property needs
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              SOYL is sold as two independent subscriptions. Take either on its own, or bundle them together for the ultimate operating system.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─── 1. BUTLER AI ───────────────────────────────── */}
      <section className="py-20 bg-[var(--color-light-grey)] border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-mint-light)] text-[var(--color-mint-dark)] mb-6">
              <Sparkles size={32} />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-charcoal)] mb-4">Butler AI</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              The AI guest-experience and operations layer.<br />
              Priced <strong>per room per month</strong>. Starts with a <strong>1-month free trial</strong>.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
            {/* Starter */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow flex flex-col">
              <h3 className="text-xl font-semibold text-[var(--color-charcoal)] mb-2">Starter</h3>
              <div className="text-sm text-gray-500 mb-6 min-h-[40px]">Getting started with digital concierge</div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[var(--color-charcoal)]">₹199</span>
                <span className="text-gray-500"> / room</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-[var(--color-mint-dark)]" /> Chat concierge</li>
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-[var(--color-mint-dark)]" /> QR system</li>
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-[var(--color-mint-dark)]" /> Guest service requests</li>
              </ul>
              <Link href="/contact" className="block text-center w-full py-3 rounded-xl border border-gray-200 font-semibold text-[var(--color-charcoal)] hover:bg-gray-50 transition-colors">Start Free Trial</Link>
            </div>

            {/* Core */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-shadow flex flex-col relative">
              <h3 className="text-xl font-semibold text-[var(--color-charcoal)] mb-2">Core</h3>
              <div className="text-sm text-gray-500 mb-6 min-h-[40px]">Hotels wanting payments, dashboards & upsell</div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[var(--color-charcoal)]">₹299</span>
                <span className="text-gray-500"> / room</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-[var(--color-mint-dark)]" /> Everything in Starter</li>
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-[var(--color-mint-dark)]" /> Ops dashboard</li>
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-[var(--color-mint-dark)]" /> Rule-based upsell engine</li>
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-[var(--color-mint-dark)]" /> Full guest feedback</li>
              </ul>
              <Link href="/contact" className="block text-center w-full py-3 rounded-xl border border-gray-200 font-semibold text-[var(--color-charcoal)] hover:bg-gray-50 transition-colors">Start Free Trial</Link>
            </div>

            {/* Butler (Most Popular) */}
            <div className="bg-[var(--color-charcoal)] text-white rounded-3xl p-8 shadow-2xl relative flex flex-col transform md:-translate-y-4 border border-gray-800">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[var(--color-mint-dark)] to-emerald-400 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Butler</h3>
              <div className="text-sm text-gray-400 mb-6 min-h-[40px]">The full AI layer, voice included</div>
              <div className="mb-6">
                <span className="text-4xl font-bold">₹499</span>
                <span className="text-gray-400"> / room</span>
              </div>
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[var(--color-mint)]" /> Everything in Core</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[var(--color-mint)]" /> AI Voice (outbound + in-app)</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[var(--color-mint)]" /> Pre check-in calls</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[var(--color-mint)]" /> AI-driven upsell engine</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[var(--color-mint)]" /> Priority support & free setup</li>
              </ul>
              <Link href="/book-demo" className="block text-center w-full py-3 rounded-xl bg-[var(--color-mint)] text-black font-semibold hover:bg-[var(--color-mint-dark)] transition-colors">Book a Demo</Link>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm mb-20">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-4 px-6 font-semibold text-gray-900 w-2/5">Feature Comparison</th>
                    <th className="py-4 px-6 font-semibold text-gray-900 text-center">Starter</th>
                    <th className="py-4 px-6 font-semibold text-gray-900 text-center">Core</th>
                    <th className="py-4 px-6 font-semibold text-[var(--color-mint-dark)] text-center">Butler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {butlerFeatures.map((f, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-6 text-sm text-gray-700">{f.name}</td>
                      {f.tiers.map((tier, idx) => (
                        <td key={idx} className={`py-3 px-6 text-sm text-center ${tier === '✗' ? 'text-gray-300' : tier === '✓' ? 'text-[var(--color-mint-dark)]' : 'text-gray-600 font-medium'}`}>
                          {tier}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add-ons */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-[var(--color-charcoal)] mb-6 text-center">Butler AI Add-ons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-lg">Digital Check-in</h4>
                  <span className="font-bold text-[var(--color-charcoal)]">₹4,000<span className="text-sm text-gray-500 font-normal">/mo</span></span>
                </div>
                <p className="text-sm text-gray-600">Pre-arrival government-ID collection (email invite or room-QR fallback), staff approval, auto-purge 30 days after checkout.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold text-lg">Inbound Voice</h4>
                  <span className="font-bold text-[var(--color-charcoal)]">₹5,000<span className="text-sm text-gray-500 font-normal">/mo</span></span>
                </div>
                <p className="text-sm text-gray-600">Dedicated ExoPhone number. Guests can call the hotel directly via phone line, in addition to the included in-app voice feature.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. PMS LITE ────────────────────────────────── */}
      <section className="py-24 bg-white relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-6">
                <Building2 size={32} />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-charcoal)] mb-4">PMS Lite</h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                The property-management backbone. A simple, flat monthly fee for any size of hotel. Includes front desk, room management, billing, and reports.
              </p>
              <ul className="flex flex-col gap-3 mb-8">
                {["Check-in and check-out", "Folio & customer management", "Revenue management & night audit", "Inventory control"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 font-medium">
                    <Check size={18} className="text-blue-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full max-w-sm">
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10" />
                <h3 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">Flat Rate</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-blue-600">₹9,999</span>
                  <span className="text-gray-500 block mt-1">per property / month</span>
                </div>
                
                <div className="border-t border-gray-100 pt-6 mt-6">
                  <h4 className="font-semibold text-sm mb-3 uppercase tracking-wider text-gray-500">Optional Add-on</h4>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-sm font-medium">OTA / Channel Manager</span>
                    <span className="text-sm font-bold">+₹2,999/mo</span>
                  </div>
                </div>
                
                <Link href="/book-demo" className="mt-8 block text-center w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">Book PMS Demo</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BUNDLE EXAMPLES ────────────────────────────── */}
      <section className="py-20 bg-[var(--color-charcoal)] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Bundle Examples</h2>
          <p className="text-gray-400 mb-12 max-w-xl mx-auto">See how much it costs to run your entire property on SOYL AI (Butler AI + PMS Lite combined).</p>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="py-4 px-6 font-semibold">Rooms</th>
                  <th className="py-4 px-6 font-semibold">Butler AI (Tier)</th>
                  <th className="py-4 px-6 font-semibold">PMS Lite</th>
                  <th className="py-4 px-6 font-semibold text-[var(--color-mint)]">Total / month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-medium">30 Rooms</td>
                  <td className="py-4 px-6 text-gray-300">₹14,970 <span className="text-xs text-gray-500">(Butler tier)</span></td>
                  <td className="py-4 px-6 text-gray-300">₹9,999</td>
                  <td className="py-4 px-6 font-bold text-[var(--color-mint)]">₹24,969</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-medium">50 Rooms</td>
                  <td className="py-4 px-6 text-gray-300">₹24,950 <span className="text-xs text-gray-500">(Butler tier)</span></td>
                  <td className="py-4 px-6 text-gray-300">₹9,999</td>
                  <td className="py-4 px-6 font-bold text-[var(--color-mint)]">₹34,949</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-medium">100 Rooms</td>
                  <td className="py-4 px-6 text-gray-300">₹49,900 <span className="text-xs text-gray-500">(Butler tier)</span></td>
                  <td className="py-4 px-6 text-gray-300">₹9,999</td>
                  <td className="py-4 px-6 font-bold text-[var(--color-mint)]">₹59,899</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── TERMS AND FAQ ──────────────────────────────── */}
      <section className="py-24 bg-[var(--color-light-grey)]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-[var(--color-charcoal)] mb-8 flex items-center gap-2">
            <Info size={24} className="text-[var(--color-mint-dark)]" /> Terms & Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">Commitment & Billing</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every property receives a <strong>1-month free trial</strong> on entry. After the trial, there is a minimum 3-month prepaid commitment. Billing is processed quarterly, in advance.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-2">Target Segment</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                SOYL is built and priced specifically for small to mid-size independent hotels and boutique properties up to 100 rooms.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm md:col-span-2">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <PhoneCall size={16} /> AI Voice Usage limits
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                The Butler tier includes <strong>30 minutes of AI voice per room per month</strong>. This voice engine draws from premium OpenAI Realtime models for unmatched, ultra-realistic conversational quality.
              </p>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-700 font-medium mb-1">Overage Pricing</p>
                <p className="text-sm text-gray-500">Any voice usage beyond the included monthly limit is metered at <strong>₹10 per minute</strong>, billed in whole-minute increments.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
