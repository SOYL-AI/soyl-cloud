"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Play, Check, QrCode, ChefHat, Package, BarChart3, Users, Smartphone, Clock, Utensils, Wine, Zap, Cloud } from "lucide-react";
import BrowserMockup from "@/components/BrowserMockup";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export default function SoylDine() {
  return (
    <div className="flex flex-col">

      {/* ═══ HERO ═══ */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/60 via-white to-white" />
          <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-amber-200 opacity-[0.06] rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-amber-200 text-xs font-bold uppercase tracking-wider text-amber-700 mb-6 shadow-sm">
                <Utensils size={14} /> SOYL Dine
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-5xl lg:text-7xl font-bold tracking-tight text-[var(--color-charcoal)] leading-[1.05] mb-6">
                Modern Dining,<br />
                <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">Digitized.</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-lg text-gray-500 mb-8 max-w-lg leading-relaxed">
                The complete restaurant management system. QR ordering, kitchen displays, inventory tracking, and analytics — all from one dashboard.
              </motion.p>

              <motion.div variants={fadeUp} className="flex gap-4">
                <Link href="/book-demo" className="bg-[var(--color-charcoal)] text-white px-7 py-3.5 rounded-full font-semibold hover:bg-black transition-all inline-flex items-center gap-2 group shadow-lg shadow-gray-900/10">
                  Book Demo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="bg-white text-gray-700 border border-gray-200 px-7 py-3.5 rounded-full font-semibold hover:shadow-md transition-all inline-flex items-center gap-2">
                  <Play size={16} className="text-amber-600" /> Watch Tour
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <BrowserMockup src="/images/restaurant_digital.png" alt="SOYL Dine Dashboard" className="shadow-2xl shadow-amber-200/30" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES BENTO GRID ═══ */}
      <section className="py-24 bg-[var(--color-light-grey)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-4">Features</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-6">
              Everything to Run Your Restaurant
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-500">
              A unified suite of tools designed for modern dining experiences.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: QrCode, title: "QR Ordering", desc: "Guests scan, browse the menu, order, and pay — all from their phone. Zero friction.", color: "bg-amber-50 text-amber-600" },
              { icon: ChefHat, title: "Kitchen Display", desc: "Digital tickets sync prep times across stations. No more lost orders.", color: "bg-orange-50 text-orange-600" },
              { icon: Package, title: "Inventory Tracking", desc: "Real-time ingredient deduction prevents stockouts and reduces waste by up to 30%.", color: "bg-emerald-50 text-emerald-600" },
              { icon: BarChart3, title: "Analytics & Reports", desc: "Track top sellers, peak hours, staff performance, and revenue trends.", color: "bg-blue-50 text-blue-600" },
              { icon: Users, title: "Customer Profiles", desc: "Build guest profiles to track preferences, allergies, and loyalty visits.", color: "bg-purple-50 text-purple-600" },
              { icon: Smartphone, title: "Table Management", desc: "Visual floor plans with real-time table status and turn-time tracking.", color: "bg-pink-50 text-pink-600" },
              { icon: Clock, title: "Multi-Outlet Control", desc: "Centralize menus, pricing, and recipes across all your locations.", color: "bg-teal-50 text-teal-600" },
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeUp} className={`bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${i === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
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

      {/* ═══ HOW QR ORDERING WORKS ═══ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-4">How It Works</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)]">
              QR to Kitchen in Seconds
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-gray-200 via-amber-300 to-gray-200 z-0" />
            {[
              { step: "1", title: "Scan QR", desc: "Guest scans the table QR code with their phone camera." },
              { step: "2", title: "Browse & Order", desc: "Full digital menu with images, descriptions, and dietary filters." },
              { step: "3", title: "Kitchen Gets It", desc: "Order appears instantly on the kitchen display system." },
              { step: "4", title: "Pay & Done", desc: "Guest pays digitally or requests the bill. No waiting." },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="relative z-10 text-center">
                <div className="w-12 h-12 bg-white border-2 border-amber-400 text-amber-600 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-6 shadow-sm">
                  {item.step}
                </div>
                <h4 className="text-lg font-bold text-[var(--color-charcoal)] mb-2">{item.title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ BUILT FOR ═══ */}
      <section className="py-24 bg-[var(--color-light-grey)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.p variants={fadeUp} className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-4">Built For</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-charcoal)]">
              Every Kind of F&B Business
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Wine, title: "Fine Dining", desc: "Elegant QR menus with images and wine pairing suggestions. No app needed.", color: "text-amber-600 bg-amber-50" },
              { icon: Zap, title: "Quick Service", desc: "Speed-optimized ordering and kitchen ticket routing for high-volume restaurants.", color: "text-orange-600 bg-orange-50" },
              { icon: Cloud, title: "Cloud Kitchens", desc: "Multi-brand management with separate menus, unified analytics.", color: "text-blue-600 bg-blue-50" },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-white rounded-2xl p-10 border border-gray-100 hover:shadow-xl transition-all duration-300 text-center flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${item.color}`}>
                  <item.icon size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--color-charcoal)]">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-32 bg-[var(--color-charcoal)] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500 opacity-5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Ready to digitize your restaurant?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join the restaurants that chose SOYL Dine to modernize their operations.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link href="/book-demo" className="bg-white text-[var(--color-charcoal)] px-8 py-4 rounded-full font-bold text-lg hover:bg-amber-50 transition-all inline-flex items-center gap-2 group">
                Book Your Free Demo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
