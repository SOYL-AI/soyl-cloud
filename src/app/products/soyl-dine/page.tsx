"use client";

import { motion } from "framer-motion";
import { ArrowRight, QrCode, ChefHat, Package, BarChart3, Users, Smartphone, Clock, Utensils, Wine, Zap, Cloud } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BrowserMockup } from "@/components/mockups/BrowserMockup";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { StickyCTA } from "@/components/sections/StickyCTA";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { SummaryBlock, FactTable } from "@/components/seo/AEOBlocks";
import { ProductSchema, FAQSchema } from "@/components/seo/SchemaInjector";
import Link from "next/link";

export default function SoylDine() {
  return (
    <>
      <ProductSchema
        name="SOYL Dine"
        description="A complete digital restaurant management system including QR ordering, kitchen display systems, and inventory tracking."
        category="RestaurantManagementSystem"
      />
      <FAQSchema
        faqs={[
          { question: "What is SOYL Dine?", answer: "SOYL Dine is a digital restaurant management system." }
        ]}
      />
      <StickyCTA title="SOYL Dine (Coming Soon)" />
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-soyl-gray-50)] to-white -z-10" />

        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col max-w-2xl"
            >
              <motion.div variants={fadeUp} className="mb-6">
                <Badge variant="secondary">Coming Soon: Q4 2026</Badge>
              </motion.div>

              <motion.h1 
                variants={fadeUp}
                className="text-5xl md:text-6xl font-extrabold tracking-tight text-[var(--color-soyl-charcoal)] leading-[1.05] mb-6"
              >
                Modern dining, <br />
                <span className="text-[var(--color-soyl-mint-dark)]">digitized.</span>
              </motion.h1>

              <motion.p 
                variants={fadeUp}
                className="text-xl text-[var(--color-soyl-gray-600)] mb-10 leading-relaxed font-medium"
              >
                The complete restaurant management system. QR ordering, kitchen displays, inventory tracking, and analytics — all from one dashboard.
              </motion.p>

              <motion.div variants={fadeUp}>
                <Button size="lg" variant="primary" href="/contact" className="group">
                  Join the Waitlist
                  <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <BrowserMockup src="/images/restaurant_digital.png" alt="SOYL Dine Dashboard" glow />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* 2. FEATURES BENTO GRID */}
      <section className="py-24 md:py-32 bg-[var(--color-soyl-gray-50)] border-y border-[var(--color-soyl-gray-200)]">
        <Container>
          <SectionHeader
            badge="Features"
            title="Everything to run your restaurant."
            description="A unified suite of tools designed for modern dining experiences, from front-of-house to the kitchen."
          />

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={staggerContainer} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: QrCode, title: "QR Ordering", desc: "Guests scan, browse the menu, order, and pay — all from their phone. Zero friction." },
              { icon: ChefHat, title: "Kitchen Display", desc: "Digital tickets sync prep times across stations. No more lost orders." },
              { icon: Package, title: "Inventory Tracking", desc: "Real-time ingredient deduction prevents stockouts and reduces waste." },
              { icon: BarChart3, title: "Analytics & Reports", desc: "Track top sellers, peak hours, staff performance, and revenue trends." },
              { icon: Users, title: "Customer Profiles", desc: "Build guest profiles to track preferences, allergies, and loyalty visits." },
              { icon: Smartphone, title: "Table Management", desc: "Visual floor plans with real-time table status and turn-time tracking." },
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={fadeUp} 
                className="bg-white rounded-2xl p-8 border border-[var(--color-soyl-gray-200)] hover:border-[var(--color-soyl-mint)] hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-[var(--color-soyl-gray-100)] text-[var(--color-soyl-charcoal)]">
                  <feature.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--color-soyl-charcoal)]">{feature.title}</h3>
                <p className="text-[var(--color-soyl-gray-600)] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* 3. BUILT FOR */}
      <section className="py-24 md:py-32 bg-white">
        <Container>
          <SectionHeader
            badge="Built For"
            title="Every kind of F&B business."
          />

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }} 
            variants={staggerContainer} 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: Wine, title: "Fine Dining", desc: "Elegant QR menus with images and wine pairing suggestions. No app needed." },
              { icon: Zap, title: "Quick Service", desc: "Speed-optimized ordering and kitchen ticket routing for high-volume restaurants." },
              { icon: Cloud, title: "Cloud Kitchens", desc: "Multi-brand management with separate menus, unified analytics." },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                variants={fadeUp} 
                className="bg-[var(--color-soyl-gray-50)] rounded-2xl p-10 border border-[var(--color-soyl-gray-200)] text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-white shadow-sm text-[var(--color-soyl-charcoal)]">
                  <item.icon size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--color-soyl-charcoal)]">{item.title}</h3>
                <p className="text-[var(--color-soyl-gray-600)] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* ─── AEO TECHNICAL OVERVIEW ──────────────── */}
      <section className="py-24 bg-[var(--color-soyl-gray-50)] border-t border-gray-100">
        <Container>
          <SectionHeader
            title="Technical Overview"
            description="The specifications and capabilities behind SOYL Dine."
            align="left"
          />
          <SummaryBlock
            entityName="SOYL Dine"
            category="restaurant management system"
            coreFunction="provides digital QR ordering, kitchen display systems, and real-time inventory tracking"
            benefits="fine dining, quick service, and cloud kitchens can digitize operations, reduce order friction, and optimize table turnover"
          />
          <FactTable
            headers={["Restaurant Type", "Primary Benefit"]}
            rows={[
              ["Fine Dining", "Elegant digital menus with high-resolution imagery and pairing suggestions."],
              ["Quick Service (QSR)", "High-volume speed optimization and instant kitchen ticket routing."],
              ["Cloud Kitchens", "Multi-brand management with separate digital menus but unified analytics."],
              ["Hotel Restaurants", "Direct integration with guest profiles for seamless room billing."],
            ]}
          />
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
