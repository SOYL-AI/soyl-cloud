"use client";

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
  ScanLine,
  BotMessageSquare,
  ClipboardCheck,
} from "lucide-react";
import { BrowserMockup } from "@/components/mockups/BrowserMockup";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { StickyCTA } from "@/components/sections/StickyCTA";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";

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
    desc: "Every request becomes a trackable task automatically routed to the right department.",
    icon: Route,
    span: "md:col-span-1 md:row-span-2",
    image: "/images/products_pics/ops-console-tasks-page-darkmode.png",
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
    image: "/images/products_pics/Dark mode new .png",
    imageAlt: "SOS Emergency Feature",
  },
  {
    title: "AI Voice Calls",
    desc: "Schedule automated wake-up calls, pre-arrival confirmations, and stay check-ins with natural AI voices.",
    icon: Phone,
    span: "md:col-span-2 md:row-span-1",
    image: "/images/products_pics/New image Butler Rooms .png",
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
  { icon: ScanLine, label: "Guest Scans QR", desc: "No app download — instant access" },
  { icon: BotMessageSquare, label: "Opens Concierge", desc: "Beautiful interface with services" },
  { icon: MessageSquare, label: "Makes Request", desc: "\"I need extra towels\" via chat" },
  { icon: ArrowRightLeft, label: "AI Routes to Staff", desc: "Automatically assigned to team" },
  { icon: ClipboardCheck, label: "Task Completed", desc: "Staff fulfills & guest is notified" },
];

export default function ButlerAIPage() {
  return (
    <div className="flex flex-col">
      <StickyCTA title="Butler AI — Guest Concierge" />

      {/* ─── 1 · HERO ─────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse,_var(--color-soyl-mint)_0%,_transparent_70%)] opacity-20 -z-10 blur-2xl" />

        <Container size="lg" className="text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <Badge variant="outline" className="mb-8">
              <span className="w-2 h-2 rounded-full bg-[var(--color-soyl-mint-dark)] animate-pulse mr-2 inline-block" />
              Butler AI — Guest Concierge
            </Badge>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] leading-[1.05] mb-6">
              Meet <span className="text-[var(--color-soyl-mint-dark)]">Butler AI</span>
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-[var(--color-soyl-gray-600)] max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
              The AI concierge your guests actually love using. Instant service requests, multilingual chat, and seamless staff coordination — all from a single QR scan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 md:mb-24">
              <Button size="lg" variant="primary" href="/book-demo" className="group">
                Book a Demo
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="group">
                <Play size={18} className="mr-2 text-[var(--color-soyl-mint-dark)]" />
                Watch Product Tour
              </Button>
            </div>
          </motion.div>

          {/* Dual Mockup Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
            className="relative max-w-5xl mx-auto flex justify-center"
          >
            <div className="absolute -inset-6 bg-gradient-to-b from-[var(--color-soyl-mint)] via-transparent to-transparent opacity-30 rounded-[3rem] blur-3xl -z-10" />
            
            <div className="relative w-full flex justify-center items-end">
              <div className="w-[85%] md:w-[75%] hidden md:block">
                <BrowserMockup
                  src="/images/products_pics/Butler AI new OPs console .png"
                  alt="Butler AI Staff Dashboard"
                  glow={true}
                  float={true}
                />
              </div>
              <div className="md:absolute right-[5%] bottom-[-10%] w-[280px] md:w-[320px] z-20">
                <PhoneMockup
                  src="/images/products_pics/Butler New 1.png"
                  alt="Guest View"
                  float={true}
                />
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ─── Social proof strip ───────────────────────── */}
      <section className="py-12 border-y border-gray-100 bg-white">
        <Container>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: "< 30s", label: "Avg. response time" },
              { value: "92%", label: "Guest satisfaction" },
              { value: "50+", label: "Languages supported" },
              { value: "0", label: "App downloads needed" },
            ].map((stat) => (
              <motion.div variants={staggerItem} key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-[var(--color-soyl-charcoal)] mb-1">{stat.value}</div>
                <div className="text-sm text-[var(--color-soyl-gray-600)]">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ─── 2 · DUAL EXPERIENCE ──────────────────────── */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <Container>
          <SectionHeader
            title="Two sides. One seamless experience."
            description="Guests make requests through a beautiful mobile interface. Staff see everything in a powerful dashboard. Butler AI connects both, instantly."
            align="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-4 items-center mt-16">
            {/* LEFT — Guest */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="bg-gradient-to-br from-[#f0f9f8] to-[#e8f4f2] rounded-[2rem] p-8 md:p-12">
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-soyl-mint-dark)]/10 text-[var(--color-soyl-mint-dark)] text-sm font-semibold mb-4">Guest Experience</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-3">
                    Beautiful on every phone
                  </h3>
                  <p className="text-[var(--color-soyl-gray-600)] leading-relaxed">
                    No app to download. Guests scan a QR code and instantly access a full concierge — request towels, order room service, or chat with your team.
                  </p>
                </div>
                <PhoneMockup
                  src="/images/products_pics/Butelr new image .png"
                  alt="Butler AI Guest Chat Interface"
                  float={true}
                />
              </div>
            </motion.div>

            {/* CENTER — Flow indicator */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="hidden lg:flex flex-col items-center gap-3 text-center px-4"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-soyl-charcoal)] flex items-center justify-center text-white">
                <ArrowRightLeft size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest leading-tight">
                Instant<br />sync
              </span>
              <div className="w-px h-16 bg-gradient-to-b from-gray-300 to-transparent" />
            </motion.div>

            {/* RIGHT — Staff */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="bg-[var(--color-soyl-gray-50)] rounded-[2rem] p-8 md:p-12">
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-soyl-charcoal)]/10 text-[var(--color-soyl-charcoal)] text-sm font-semibold mb-4">Staff Dashboard</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-3">
                    Everything in one place
                  </h3>
                  <p className="text-[var(--color-soyl-gray-600)] leading-relaxed">
                    Staff see all guest conversations, active requests, and task statuses in a unified dashboard. No switching between apps.
                  </p>
                </div>
                <BrowserMockup
                  src="/images/products_pics/Butler AI new OPs console .png"
                  alt="Butler AI Staff Dashboard"
                  float={true}
                />
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ─── 3 · BENTO GRID FEATURES ─────────────────── */}
      <section className="py-24 md:py-32 bg-[var(--color-soyl-gray-50)]">
        <Container>
          <SectionHeader
            title="Everything your guests need"
            description="A comprehensive digital concierge packed with features that delight guests and empower staff."
            align="center"
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(220px,auto)] gap-5 mt-16"
          >
            {bentoFeatures.map((f) => (
              <motion.div
                key={f.title}
                variants={staggerItem}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-[var(--color-soyl-mint-light)]/40 transition-all duration-300 overflow-hidden flex flex-col ${f.span}`}
              >
                <div className={`p-7 flex flex-col flex-1 ${f.image ? "" : "justify-center"}`}>
                  <div className="w-11 h-11 rounded-2xl bg-[var(--color-soyl-mint-light)] flex items-center justify-center mb-5 text-[var(--color-soyl-mint-dark)] shrink-0">
                    <f.icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-soyl-charcoal)] mb-2">{f.title}</h3>
                  <p className="text-sm text-[var(--color-soyl-gray-600)] leading-relaxed">{f.desc}</p>
                </div>

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
        </Container>
      </section>

      {/* ─── 4 · HOW IT WORKS — TIMELINE ─────────────── */}
      <section className="py-24 md:py-32 bg-white">
        <Container>
          <SectionHeader
            title="From scan to solved in minutes"
            description="Five simple steps. Zero friction. Here's how Butler AI turns a guest request into a completed task."
            align="center"
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="relative mt-16"
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
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    i === timelineSteps.length - 1
                      ? "bg-[var(--color-soyl-mint-dark)] text-white"
                      : "bg-white border-2 border-gray-200 text-[var(--color-soyl-charcoal)]"
                  }`}>
                    <step.icon size={22} />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-soyl-mint-dark)] mb-1 block">
                      Step {i + 1}
                    </span>
                    <h4 className="text-base font-semibold text-[var(--color-soyl-charcoal)] mb-1">{step.label}</h4>
                    <p className="text-sm text-[var(--color-soyl-gray-600)] leading-relaxed max-w-[200px] mx-auto">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ─── 5 · CTA ──────────────────────────────────── */}
      <FinalCTA />
    </div>
  );
}

