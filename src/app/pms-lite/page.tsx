"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Users,
  CreditCard,
  LineChart,
} from "lucide-react";
import BrowserMockup from "@/components/BrowserMockup";

/* ─── Animated Counter ─── */
function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = target;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

/* ─── Feature Showcase Component ─── */
function FeatureShowcase({
  badgeText,
  badgeIcon: BadgeIcon,
  title,
  description,
  bullets,
  imageSrc,
  imageAlt,
  reverse = false,
}: {
  badgeText: string;
  badgeIcon: any;
  title: string;
  description: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
}) {
  return (
    <div className={`py-24 ${reverse ? "bg-[var(--color-light-grey)]" : "bg-white"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div
          className={`flex flex-col gap-12 lg:gap-20 items-center ${
            reverse ? "lg:flex-row-reverse" : "lg:flex-row"
          }`}
        >
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold uppercase tracking-wider text-blue-600 mb-6 shadow-sm">
              <BadgeIcon size={14} /> {badgeText}
            </div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-6">
              {title}
            </h3>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-lg">
              {description}
            </p>
            <ul className="flex flex-col gap-4">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-100 rounded-full p-0.5 text-blue-600 shrink-0">
                    <CheckCircle size={14} />
                  </div>
                  <span className="text-gray-700 font-medium">{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex-[1.2] w-full"
          >
            <BrowserMockup src={imageSrc} alt={imageAlt} className="shadow-2xl shadow-blue-900/10" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function PmsLite() {
  return (
    <div className="flex flex-col overflow-hidden">
      {/* ═══════════════════════════════════════════════ */}
      {/* HERO SECTION                                   */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#f0f4f8] via-white to-white" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-400 opacity-[0.05] rounded-full blur-[120px]" />
          <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-[var(--color-mint)] opacity-[0.05] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Property Management
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[5rem] font-bold tracking-tight text-[var(--color-charcoal)] leading-[1.05] mb-6">
              Your Property,<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">One Dashboard.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Manage bookings, rooms, billing, and reports from a single, clean interface. Say goodbye to messy spreadsheets and outdated legacy software.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/book-demo" className="bg-[var(--color-charcoal)] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-black transition-all inline-flex items-center justify-center gap-2 group shadow-lg shadow-gray-900/10">
                Book a Demo
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#features" className="bg-white text-[var(--color-charcoal)] border border-gray-200 px-8 py-4 rounded-full font-semibold text-lg hover:border-gray-300 hover:shadow-md transition-all inline-flex items-center justify-center gap-2">
                Explore Features
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <BrowserMockup src="/images/screenshots/Screenshot 2026-05-10 183417.png" alt="SOYL AI PMS Dashboard" className="shadow-2xl shadow-blue-900/20" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* FEATURE SHOWCASES (Petpooja-style Alternating) */}
      {/* ═══════════════════════════════════════════════ */}
      <div id="features">
        <FeatureShowcase
          badgeText="Reservations"
          badgeIcon={CalendarDays}
          title="All Your Bookings in One Place"
          description="A centralized view of all your reservations, check-ins, and check-outs. Easily filter, search, and manage guest stays with a few clicks."
          bullets={[
            "Real-time status tracking (checked in, cancelled, pending)",
            "Detailed guest profiles and booking history",
            "Advanced search and filtering capabilities",
          ]}
          imageSrc="/images/screenshots/Screenshot 2026-05-10 183446.png"
          imageAlt="PMS Lite Bookings Page"
        />

        <FeatureShowcase
          badgeText="Operations"
          badgeIcon={DoorOpen}
          title="Intelligent Room Management"
          description="Keep track of your entire property's room inventory. Assign rooms, update housekeeping statuses, and monitor availability across all room types."
          bullets={[
            "Visual floor-by-floor room grid",
            "Real-time housekeeping status updates",
            "Room type and pricing management",
          ]}
          imageSrc="/images/screenshots/Screenshot 2026-05-10 183509.png"
          imageAlt="PMS Lite Rooms Management"
          reverse
        />

        <FeatureShowcase
          badgeText="Analytics"
          badgeIcon={LineChart}
          title="Data-Driven Decisions"
          description="Transform your property's data into actionable insights. Track your key performance indicators, revenue trends, and operational metrics."
          bullets={[
            "Occupancy, ADR, and RevPAR tracking",
            "Detailed revenue and profit margins",
            "One-click export to PDF or CSV",
          ]}
          imageSrc="/images/screenshots/Screenshot 2026-05-10 183625.png"
          imageAlt="PMS Lite Reports Page"
        />
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* FEATURES GRID                                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-[var(--color-light-grey)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-6">
              Everything You Need to Run Your Property
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: LayoutDashboard, title: "KPI Dashboard", desc: "Get an instant overview of your daily occupancy, revenue, and arrivals.", color: "bg-blue-50 text-blue-600" },
              { icon: CalendarDays, title: "Bookings", desc: "Manage reservations from all your channels in a single, unified inbox.", color: "bg-indigo-50 text-indigo-600" },
              { icon: DoorOpen, title: "Rooms", desc: "Visual inventory management, housekeeping tracking, and maintenance alerts.", color: "bg-teal-50 text-teal-600" },
              { icon: Users, title: "Guests", desc: "Build rich guest profiles to track preferences, loyalty, and past stays.", color: "bg-purple-50 text-purple-600" },
              { icon: CreditCard, title: "Billing", desc: "Generate invoices, track expenses, and manage payments effortlessly.", color: "bg-emerald-50 text-emerald-600" },
              { icon: LineChart, title: "Reports", desc: "Export beautiful, branded PDF reports for your owners or management team.", color: "bg-amber-50 text-amber-600" },
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={fadeUp} 
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--color-charcoal)]">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* METRICS / SOCIAL PROOF                         */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { value: 50, suffix: "%", label: "Less time on manual data entry", desc: "Automated sync across all channels" },
              { value: 3, suffix: "x", label: "Faster check-ins", desc: "Streamlined front desk operations" },
              { value: 100, suffix: "%", label: "Cloud-based reliability", desc: "Access your property from anywhere" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center p-8 rounded-3xl bg-[var(--color-light-grey)]">
                <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-3">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-lg font-bold text-[var(--color-charcoal)] mb-2">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* CTA SECTION                                    */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-32 bg-[var(--color-charcoal)] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 opacity-10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[var(--color-mint)] opacity-10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Start managing <span className="text-blue-400">smarter</span>.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join modern properties that have switched to SOYL AI for their property management.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/book-demo" className="bg-white text-[var(--color-charcoal)] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all inline-flex items-center gap-2 group">
                Book a Demo
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
