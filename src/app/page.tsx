"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Play, Check, MessageSquare, BedDouble, Utensils, Phone, ShieldCheck, BarChart3, Zap, Globe, Clock, LayoutDashboard } from "lucide-react";
import BrowserMockup from "@/components/BrowserMockup";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* ═══════════════════════════════════════════════ */}
      {/* HERO — Centered, Mews-style with product below */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-0 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#f0f7f6] via-white to-white" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[var(--color-mint)] opacity-[0.08] rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            {/* Headline */}
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-[var(--color-charcoal)] leading-[1.05] mb-6">
              The Ecosystem for<br />
              <span className="bg-gradient-to-r from-[var(--color-mint-dark)] to-[#6BA8A2] bg-clip-text text-transparent">Modern Hospitality.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Unify your property's operations on a single, intelligent platform. Automate daily tasks, elevate guest experiences, and drive more revenue.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <Link href="/book-demo" className="bg-[var(--color-charcoal)] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-black transition-all inline-flex items-center justify-center gap-2 group shadow-lg shadow-gray-900/10">
                Book a Demo
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#products" className="bg-white text-[var(--color-charcoal)] border border-gray-200 px-8 py-4 rounded-full font-semibold text-lg hover:border-gray-300 hover:shadow-md transition-all inline-flex items-center justify-center gap-2">
                <Play size={18} className="text-[var(--color-mint-dark)]" />
                Watch Product Tour
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Image Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" as const }}
            className="relative max-w-5xl mx-auto mt-12"
          >
            <div className="absolute -inset-4 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />
            <div className="rounded-[2.5rem] overflow-hidden border border-gray-200/50 shadow-2xl shadow-gray-400/30 bg-white p-2">
              <div className="rounded-[2rem] overflow-hidden relative aspect-[16/9] w-full">
                <Image 
                  src="/images/soyl_hero_main.png" 
                  alt="SOYL AI Hospitality Platform" 
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* SOCIAL PROOF — Logo bar + stats                */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          >
            {[
              { value: "100+", label: "Properties Onboarded" },
              { value: "50K+", label: "Guest Interactions" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "<2min", label: "Avg. Response Time" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-[var(--color-charcoal)] mb-2">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* PROBLEM SECTION — Why SOYL AI                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-[var(--color-light-grey)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-[var(--color-mint-dark)] uppercase tracking-widest mb-4">The Problem</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-6">
              Your Staff Deserves Better Than Legacy Software
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-500">
              Disconnected tools, manual workflows, and zero visibility into guest needs. Sound familiar?
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Instant, Not Manual", desc: "Guest requests route automatically to the right team. No more walkie-talkies and paper logs." },
              { icon: Globe, title: "One Platform, Everything", desc: "Stop juggling 5 different tools. PMS, concierge, dining, and calls — all unified." },
              { icon: Clock, title: "Setup in Hours, Not Months", desc: "Go live in under 24 hours. No complex integrations, no IT team required." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-[var(--color-mint-light)] rounded-xl flex items-center justify-center mb-6 text-[var(--color-mint-dark)]">
                  <item.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--color-charcoal)]">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* PRODUCTS SHOWCASE — Mews-style bento           */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="products" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center max-w-3xl mx-auto mb-20">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-[var(--color-mint-dark)] uppercase tracking-widest mb-4">Products</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-6">
              The Complete Hospitality Suite
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-500">
              Three products, one platform. Everything connects seamlessly.
            </motion.p>
          </motion.div>

          {/* ─── Butler AI — Large Feature Card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-[#f7fbfa] to-[#eef5f4] rounded-[2rem] p-8 md:p-14 border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--color-mint)] text-xs font-bold uppercase tracking-wider text-[var(--color-mint-dark)] mb-6">
                    <MessageSquare size={14} /> Butler AI
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-[var(--color-charcoal)] mb-4 leading-tight">
                    Your 24/7 AI Concierge That Guests Love
                  </h3>
                  <p className="text-lg text-gray-500 mb-6 leading-relaxed">
                    Guests scan a QR code and instantly access room service, housekeeping, local recommendations, and more — through chat or voice. No app download required.
                  </p>
                  <ul className="flex flex-col gap-3 mb-8">
                    {["Voice & chat requests", "Automated task routing to staff", "Multilingual support", "Built-in upselling engine"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-600">
                        <Check size={18} className="text-[var(--color-mint-dark)] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/butler-ai" className="inline-flex items-center gap-2 bg-[var(--color-charcoal)] text-white px-6 py-3 rounded-full font-semibold hover:bg-black transition-all group">
                    Explore Butler AI
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Product visual: Phone mockup with guest view */}
                <div className="relative flex justify-center">
                  <div className="relative w-[280px] md:w-[320px]">
                    {/* Phone frame */}
                    <div className="bg-[var(--color-charcoal)] rounded-[2.5rem] p-3 shadow-2xl shadow-gray-400/30">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[var(--color-charcoal)] rounded-b-2xl z-20" />
                      {/* Screen */}
                      <div className="rounded-[2rem] overflow-hidden bg-white">
                        <Image
                          src="/images/products_pics/Guest view initial landing .png"
                          alt="Butler AI Guest View"
                          width={320}
                          height={640}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    </div>
                    {/* Floating chat bubble */}
                    <motion.div
                      initial={{ opacity: 0, x: 40, y: 20 }}
                      whileInView={{ opacity: 1, x: 0, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="absolute -right-16 top-1/3 bg-white rounded-2xl rounded-br-sm p-4 shadow-xl border border-gray-100 max-w-[200px] hidden md:block"
                    >
                      <p className="text-sm text-gray-700 font-medium">"Send extra towels please"</p>
                      <p className="text-xs text-gray-400 mt-1">Guest, Room 104</p>
                    </motion.div>
                    {/* Floating response bubble */}
                    <motion.div
                      initial={{ opacity: 0, x: -40, y: 20 }}
                      whileInView={{ opacity: 1, x: 0, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="absolute -left-20 top-1/2 bg-[var(--color-mint-light)] rounded-2xl rounded-bl-sm p-4 shadow-xl border border-[var(--color-mint)] max-w-[220px] hidden md:block"
                    >
                      <p className="text-sm text-gray-700 font-medium">✓ Routed to Housekeeping</p>
                      <p className="text-xs text-gray-500 mt-1">Auto-assigned · 3s ago</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── PMS Lite + SOYL Dine — Side by side ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PMS Lite */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-[var(--color-charcoal)] mb-6 self-start">
                <LayoutDashboard size={14} /> PMS Lite
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)] mb-3">
                Your Property, One Dashboard
              </h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Manage bookings, rooms, billing, and reports from a single, clean interface.
              </p>
              <Link href="/pms-lite" className="inline-flex items-center gap-2 text-[var(--color-charcoal)] font-semibold hover:gap-3 transition-all mb-8">
                Explore PMS Lite <ArrowRight size={18} />
              </Link>
              <div className="mt-auto">
                <BrowserMockup src="/images/screenshots/Screenshot 2026-05-10 183417.png" alt="PMS Lite Dashboard" />
              </div>
            </motion.div>

            {/* SOYL Dine */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-wider text-[var(--color-charcoal)] mb-6 self-start">
                <Utensils size={14} /> Restaurant Suite
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)] mb-3">
                Modern Dining, Digitized
              </h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                QR ordering, kitchen display systems, inventory tracking, and analytics — all in one place.
              </p>
              <Link href="/soyl-dine" className="inline-flex items-center gap-2 text-[var(--color-charcoal)] font-semibold hover:gap-3 transition-all mb-8">
                Explore SOYL Dine <ArrowRight size={18} />
              </Link>
              <div className="mt-auto">
                <BrowserMockup src="/images/restaurant_digital.png" alt="SOYL Dine" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* HOW IT WORKS — Horizontal flow                 */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-[var(--color-light-grey)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-[var(--color-mint-dark)] uppercase tracking-widest mb-4">How It Works</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-6">
              Live in Under 24 Hours
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-gray-200 via-[var(--color-mint)] to-gray-200 z-0" />

            {[
              { step: "01", title: "Sign Up", desc: "Create your property account in under 5 minutes." },
              { step: "02", title: "Configure", desc: "Set up rooms, menus, and staff roles with guided setup." },
              { step: "03", title: "Deploy QR Codes", desc: "Print and place QR codes in guest rooms and dining areas." },
              { step: "04", title: "Go Live", desc: "Start receiving guest requests and managing operations instantly." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="relative z-10 text-center">
                <div className="w-12 h-12 bg-white border-2 border-[var(--color-mint)] text-[var(--color-mint-dark)] rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-6 shadow-sm">
                  {item.step}
                </div>
                <h4 className="text-lg font-bold text-[var(--color-charcoal)] mb-2">{item.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* BUILT FOR — Target Audience                    */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-[var(--color-mint-dark)] uppercase tracking-widest mb-4">Built For</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)]">
              Every Kind of Hospitality Business
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BedDouble, title: "Boutique Hotels", desc: "Elevate guest experience with AI concierge and streamlined ops." },
              { icon: Utensils, title: "Restaurants", desc: "QR ordering, kitchen workflows, and real-time inventory." },
              { icon: ShieldCheck, title: "Resorts & Villas", desc: "Multi-property management with centralized control." },
              { icon: BarChart3, title: "Hotel Chains", desc: "Enterprise dashboards with cross-property analytics." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="group bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:bg-[var(--color-mint-light)] hover:border-[var(--color-mint)] transition-all duration-300 cursor-default">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 text-[var(--color-dark-grey)] group-hover:text-[var(--color-mint-dark)] transition-colors border border-gray-100 shadow-sm">
                  <item.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-[var(--color-charcoal)]">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* FINAL CTA                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-32 bg-[var(--color-charcoal)] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-mint-dark)] opacity-10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--color-mint)] opacity-5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Ready to modernize your property?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join forward-thinking hoteliers and restaurateurs who chose SOYL AI to power their operations.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book-demo" className="bg-white text-[var(--color-charcoal)] px-8 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-mint-light)] transition-all inline-flex items-center gap-2 group">
                Book Your Free Demo
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="border border-gray-600 text-gray-300 px-8 py-4 rounded-full font-semibold text-lg hover:border-gray-400 hover:text-white transition-all inline-flex items-center justify-center">
                Contact Sales
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
