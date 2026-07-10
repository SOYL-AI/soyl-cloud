"use client";

import { motion } from "framer-motion";
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
import { BrowserMockup } from "@/components/mockups/BrowserMockup";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { StickyCTA } from "@/components/sections/StickyCTA";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";

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
    <div className={`py-24 ${reverse ? "bg-[var(--color-soyl-gray-50)]" : "bg-white"}`}>
      <Container>
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
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex-1"
          >
            <Badge variant="outline" className="mb-6 bg-blue-50 text-blue-600 border-blue-100">
              <BadgeIcon size={14} className="mr-2 inline-block" /> {badgeText}
            </Badge>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
              {title}
            </h3>
            <p className="text-lg text-[var(--color-soyl-gray-600)] mb-8 leading-relaxed max-w-lg">
              {description}
            </p>
            <ul className="flex flex-col gap-4">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 bg-blue-100 rounded-full p-0.5 text-blue-600 shrink-0">
                    <CheckCircle size={14} />
                  </div>
                  <span className="text-[var(--color-soyl-charcoal)] font-medium">{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex-[1.2] w-full"
          >
            <BrowserMockup src={imageSrc} alt={imageAlt} className="shadow-2xl shadow-blue-900/10" />
          </motion.div>
        </div>
      </Container>
    </div>
  );
}

export default function PmsLitePage() {
  return (
    <div className="flex flex-col overflow-hidden">
      <StickyCTA title="PMS Lite — Property Management" />

      {/* ═══════════════════════════════════════════════ */}
      {/* HERO SECTION                                   */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-400 opacity-[0.05] rounded-full blur-[120px]" />
          <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-[var(--color-soyl-mint)] opacity-[0.05] rounded-full blur-[100px]" />
        </div>

        <Container className="text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeUp} className="mb-8">
              <Badge variant="outline">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2 inline-block" />
                Property Management
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-[5rem] font-bold tracking-tight text-[var(--color-soyl-charcoal)] leading-[1.05] mb-6">
              Your Property,<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">One Dashboard.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-[var(--color-soyl-gray-600)] mb-10 max-w-2xl mx-auto leading-relaxed">
              Manage bookings, rooms, billing, and reports from a single, clean interface. Say goodbye to messy spreadsheets and outdated legacy software.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" variant="primary" href="/book-demo" className="group">
                Book a Demo
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" href="#features">
                Explore Features
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative max-w-5xl mx-auto"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <BrowserMockup src="/images/products_pics/Dashboard PMS.png" alt="SOYL AI PMS Dashboard" className="shadow-2xl shadow-blue-900/20" glow={true} float={false} />
            </motion.div>
          </motion.div>
        </Container>
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
          imageSrc="/images/products_pics/Bookings PMS.png"
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
          imageSrc="/images/products_pics/Rooms PMS.png"
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
          imageSrc="/images/products_pics/Revenue PMS.png"
          imageAlt="PMS Lite Reports Page"
        />
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* FEATURES GRID                                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-[var(--color-soyl-gray-50)]">
        <Container>
          <SectionHeader
            title="Everything You Need to Run Your Property"
            align="center"
          />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
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
                variants={staggerItem} 
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--color-soyl-charcoal)]">{feature.title}</h3>
                <p className="text-[var(--color-soyl-gray-600)] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* OTA INTEGRATIONS SECTION                       */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-y border-gray-100 overflow-hidden">
        <Container>
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-4">Integrates with 100+ Channels & OTAs</h3>
            <p className="text-[var(--color-soyl-gray-600)] max-w-2xl mx-auto">Seamlessly sync inventory, rates, and bookings across all major online travel agencies with our optional Channel Manager add-on.</p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-10 opacity-60 hover:opacity-100 transition-opacity duration-500">
            {/* Booking.com */}
            <div className="text-[28px] font-bold text-[#003580]">Booking.com</div>
            {/* Expedia */}
            <div className="text-[28px] font-bold text-[#00005e]">Expedia</div>
            {/* Airbnb */}
            <div className="text-[28px] font-bold text-[#FF5A5F] tracking-tighter">airbnb</div>
            {/* Agoda */}
            <div className="text-[28px] font-bold text-[#5392F9]">agoda<span className="text-gray-400 text-sm ml-1 align-top">●</span></div>
            {/* MakeMyTrip */}
            <div className="text-[28px] font-black tracking-tight text-[#D32F2F]">make<span className="text-[#1976D2]">my</span>trip</div>
            {/* Goibibo */}
            <div className="text-[28px] font-bold tracking-tight text-[#FF6D38]">goibibo</div>
            {/* TripAdvisor */}
            <div className="text-[28px] font-bold text-[#00AF87] flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#00AF87] flex items-center justify-center text-white text-sm">O</span>
              Tripadvisor
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* METRICS / SOCIAL PROOF                         */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-20 bg-white border-y border-gray-100">
        <Container>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { value: 50, suffix: "%", label: "Less time on manual data entry" },
              { value: 3, suffix: "x", label: "Faster check-ins" },
              { value: 100, suffix: "%", label: "Cloud-based reliability" },
            ].map((stat, i) => (
              <motion.div key={i} variants={staggerItem} className="h-full">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} label={stat.label} className="h-full bg-[var(--color-soyl-gray-50)]" />
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* CTA SECTION                                    */}
      {/* ═══════════════════════════════════════════════ */}
      <FinalCTA />
    </div>
  );
}
