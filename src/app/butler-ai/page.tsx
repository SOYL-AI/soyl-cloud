"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Mic,
  Route,
  UtensilsCrossed,
  Globe,
  ShieldAlert,
  Phone,
  QrCode,
  TrendingUp,
  MessageSquare,
  ArrowRightLeft,
  CheckCircle2,
  ScanLine,
  BotMessageSquare,
  ClipboardCheck,
} from "lucide-react";
import BrowserMockup from "@/components/BrowserMockup";

/* ─── animation helpers ────────────────────────────────── */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
});

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Phone Mockup Component ──────────────────────────── */
function PhoneMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-[6px] border-[#1a1a1a] bg-[#1a1a1a] shadow-2xl overflow-hidden">
        {/* Notch / Dynamic Island */}
        <div className="relative bg-black pt-3 pb-2 flex justify-center">
          <div className="w-[90px] h-[26px] bg-[#1a1a1a] rounded-full" />
        </div>
        {/* Screen */}
        <div className="relative w-full aspect-[9/19.5] bg-white overflow-hidden">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-top"
            sizes="300px"
          />
        </div>
        {/* Home indicator */}
        <div className="bg-black py-2 flex justify-center">
          <div className="w-[100px] h-[4px] bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Bento feature data ──────────────────────────────── */
const bentoFeatures = [
  {
    title: "Voice & Chat Requests",
    desc: "Guests speak or type naturally — Butler AI understands intent and acts instantly, no training needed.",
    icon: Mic,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Automated Task Routing",
    desc: "Every request becomes a trackable task automatically routed to the right department — housekeeping, F&B, maintenance, or front desk.",
    icon: Route,
    span: "md:col-span-1 md:row-span-2",
    image: "/images/products_pics/Showing created tasks .png",
    imageAlt: "Butler AI Task Routing",
  },
  {
    title: "Room Service Orders",
    desc: "Digital menus with one-tap ordering sent directly to the kitchen display.",
    icon: UtensilsCrossed,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Multilingual Support",
    desc: "Automatically communicates with international guests in 50+ languages — no staff training required.",
    icon: Globe,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    title: "SOS & Safety Alerts",
    desc: "One-tap emergency contacts and instant escalation to property management for guest safety.",
    icon: ShieldAlert,
    span: "md:col-span-1 md:row-span-2",
    image: "/images/products_pics/SOS emergency contact save .png",
    imageAlt: "SOS Emergency Feature",
  },
  {
    title: "AI Voice Calls",
    desc: "Schedule automated wake-up calls, pre-arrival confirmations, and stay check-ins with natural AI voices.",
    icon: Phone,
    span: "md:col-span-2 md:row-span-1",
    image: "/images/products_pics/Calls scheduler light mode .png",
    imageAlt: "AI Voice Calls Scheduler",
    wide: true,
  },
  {
    title: "QR Code Access",
    desc: "No app download. Guests scan a code in-room and instantly get a full concierge experience.",
    icon: QrCode,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Smart Upselling",
    desc: "Contextual offers for late checkout, spa bookings, and room upgrades — boosting RevPAR effortlessly.",
    icon: TrendingUp,
    span: "md:col-span-1 md:row-span-1",
  },
];

/* ─── Timeline steps ──────────────────────────────────── */
const timelineSteps = [
  { icon: ScanLine, label: "Guest Scans QR", desc: "No app download — instant access from any device" },
  { icon: BotMessageSquare, label: "Opens Concierge", desc: "Beautiful interface with all hotel services" },
  { icon: MessageSquare, label: "Makes Request", desc: "\"I need extra towels\" via chat or voice" },
  { icon: ArrowRightLeft, label: "AI Routes to Staff", desc: "Automatically assigned to the right team" },
  { icon: ClipboardCheck, label: "Task Completed", desc: "Staff fulfills & closes — guest is notified" },
];

/* ═══════════════════════════════════════════════════════ */
export default function ButlerAIPage() {
  return (
    <div className="flex flex-col">
      {/* ─── 1 · HERO ─────────────────────────────────── */}
      <section className="relative pt-32 pb-12 md:pt-40 md:pb-20 overflow-hidden">
        {/* gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#eef6f5] via-[#f4faf9] to-white -z-10" />
        {/* subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse,_var(--color-mint)_0%,_transparent_70%)] opacity-20 -z-10 blur-2xl" />

        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* pill badge */}
          <motion.div {...fade()} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--color-mint-dark)] animate-pulse" />
            Butler AI — Guest Concierge
          </motion.div>

          <motion.h1
            {...fade(0.05)}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[var(--color-charcoal)] leading-[1.05] mb-6"
          >
            Meet <span className="text-[var(--color-mint-dark)]">Butler AI</span>
          </motion.h1>

          <motion.p
            {...fade(0.1)}
            className="text-lg md:text-xl lg:text-2xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed text-balance"
          >
            The AI concierge your guests actually love using. Instant service requests, multilingual chat, and seamless staff coordination — all from a single QR scan.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fade(0.15)} className="flex flex-col sm:flex-row gap-4 justify-center mb-16 md:mb-20">
            <Link
              href="/book-demo"
              className="bg-[var(--color-charcoal)] text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-black transition-all flex items-center justify-center gap-2 group"
            >
              Book Demo
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="bg-white text-[var(--color-charcoal)] border border-gray-200 px-8 py-4 rounded-full font-medium text-lg hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 group">
              <Play size={18} className="text-[var(--color-mint-dark)]" />
              Watch Demo
            </button>
          </motion.div>

          {/* Hero product showcase */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-5xl mx-auto"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* glow behind mockup */}
              <div className="absolute -inset-6 bg-gradient-to-b from-[var(--color-mint)] via-transparent to-transparent opacity-30 rounded-[3rem] blur-3xl -z-10" />
              <BrowserMockup
                src="/images/products_pics/new_guest_view.png"
                alt="Butler AI Guest View"
                className="shadow-[0_30px_100px_-15px_rgba(0,0,0,0.15)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Social proof strip ───────────────────────── */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            {...fade()}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: "< 30s", label: "Avg. response time" },
              { value: "92%", label: "Guest satisfaction" },
              { value: "50+", label: "Languages supported" },
              { value: "0", label: "App downloads needed" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-[var(--color-charcoal)] mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 2 · DUAL EXPERIENCE ──────────────────────── */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <motion.div {...fade()} className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-5">
              Two sides. One seamless experience.
            </h2>
            <p className="text-lg md:text-xl text-gray-500 text-balance">
              Guests make requests through a beautiful mobile interface. Staff see everything in a powerful dashboard. Butler AI connects both, instantly.
            </p>
          </motion.div>

          {/* Split view */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-4 items-center">
            {/* LEFT — Guest */}
            <motion.div {...fade(0.05)}>
              <div className="bg-gradient-to-br from-[#f0f9f8] to-[#e8f4f2] rounded-[2rem] p-8 md:p-12">
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-mint-dark)]/10 text-[var(--color-mint-dark)] text-sm font-semibold mb-4">Guest Experience</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)] mb-3">
                    Beautiful on every phone
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    No app to download. Guests scan a QR code and instantly access a full concierge — request towels, order room service, or chat with your team.
                  </p>
                </div>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PhoneMockup
                    src="/images/products_pics/COncierge chat asking something guest mode .png"
                    alt="Butler AI Guest Chat Interface"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* CENTER — Flow indicator */}
            <motion.div
              {...fade(0.15)}
              className="hidden lg:flex flex-col items-center gap-3 text-center px-4"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-charcoal)] flex items-center justify-center text-white">
                <ArrowRightLeft size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest leading-tight">
                Instant<br />sync
              </span>
              <div className="w-px h-16 bg-gradient-to-b from-gray-300 to-transparent" />
            </motion.div>

            {/* RIGHT — Staff */}
            <motion.div {...fade(0.1)}>
              <div className="bg-[#f8f8fa] rounded-[2rem] p-8 md:p-12">
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-charcoal)]/10 text-[var(--color-charcoal)] text-sm font-semibold mb-4">Staff Dashboard</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)] mb-3">
                    Everything in one place
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Staff see all guest conversations, active requests, and task statuses in a unified dashboard. No switching between apps.
                  </p>
                </div>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                  <BrowserMockup
                    src="/images/products_pics/new_ops_console.png"
                    alt="Butler AI Staff Dashboard"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 3 · BENTO GRID FEATURES ─────────────────── */}
      <section className="py-24 md:py-32 bg-[var(--color-light-grey)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fade()} className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-5">
              Everything your guests need
            </h2>
            <p className="text-lg md:text-xl text-gray-500 text-balance">
              A comprehensive digital concierge packed with features that delight guests and empower staff.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(220px,auto)] gap-5"
          >
            {bentoFeatures.map((f) => (
              <motion.div
                key={f.title}
                variants={staggerItem}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[var(--color-mint-light)]/40 transition-all duration-300 overflow-hidden flex flex-col ${f.span}`}
              >
                <div className={`p-7 flex flex-col flex-1 ${f.image ? "" : "justify-center"}`}>
                  {/* icon */}
                  <div className="w-11 h-11 rounded-2xl bg-[var(--color-mint-light)] flex items-center justify-center mb-5 text-[var(--color-mint-dark)] shrink-0">
                    <f.icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-charcoal)] mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>

                {/* optional product screenshot */}
                {f.image && (
                  <div className={`relative mt-auto overflow-hidden ${f.wide ? "h-[200px] md:h-[240px]" : "h-[180px] md:h-[220px]"}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent z-10 pointer-events-none" />
                    <Image
                      src={f.image}
                      alt={f.imageAlt || f.title}
                      fill
                      className="object-cover object-top px-4 group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 4 · HOW IT WORKS — TIMELINE ─────────────── */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fade()} className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-5">
              From scan to solved in minutes
            </h2>
            <p className="text-lg md:text-xl text-gray-500 text-balance">
              Five simple steps. Zero friction. Here&apos;s how Butler AI turns a guest request into a completed task.
            </p>
          </motion.div>

          {/* Horizontal timeline — scrollable on mobile */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="relative"
          >
            {/* connecting line (desktop) */}
            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent z-0" />

            <div className="flex flex-col md:flex-row gap-8 md:gap-0 md:justify-between relative z-10">
              {timelineSteps.map((step, i) => (
                <motion.div
                  key={step.label}
                  variants={staggerItem}
                  className="flex md:flex-col items-start md:items-center gap-5 md:gap-4 md:flex-1 md:px-3 text-left md:text-center"
                >
                  {/* Step circle */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    i === timelineSteps.length - 1
                      ? "bg-[var(--color-mint-dark)] text-white"
                      : "bg-white border-2 border-gray-200 text-[var(--color-charcoal)]"
                  }`}>
                    <step.icon size={22} />
                  </div>

                  <div>
                    {/* Step number */}
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-mint-dark)] mb-1 block">
                      Step {i + 1}
                    </span>
                    <h4 className="text-base font-semibold text-[var(--color-charcoal)] mb-1">{step.label}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 5 · CTA ──────────────────────────────────── */}
      <section className="py-28 md:py-36 bg-[var(--color-charcoal)] text-white text-center relative overflow-hidden">
        {/* subtle radial overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700 via-[var(--color-charcoal)] to-black opacity-50" />
        {/* mint glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[var(--color-mint)] opacity-[0.06] blur-[100px] rounded-full" />

        <motion.div {...fade()} className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
            Ready to delight<br />your guests?
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl mx-auto text-balance">
            See how Butler AI can transform guest experiences at your property. Book a personalized demo with our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book-demo"
              className="bg-[var(--color-mint)] text-[var(--color-charcoal)] px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition-all inline-flex items-center justify-center gap-2 group"
            >
              Book Your Demo
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="bg-transparent text-white border border-gray-600 px-8 py-4 rounded-full font-medium text-lg hover:border-gray-400 hover:bg-white/5 transition-all inline-flex items-center justify-center"
            >
              Contact Sales
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
