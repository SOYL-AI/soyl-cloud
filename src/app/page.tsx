"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BrowserMockup } from "@/components/mockups/BrowserMockup";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { MetricsStrip } from "@/components/sections/MetricsStrip";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { StickyCTA } from "@/components/sections/StickyCTA";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { SummaryBlock, DefinitionList, FactTable } from "@/components/seo/AEOBlocks";
import { ProductSchema } from "@/components/seo/SchemaInjector";

export default function Home() {
  return (
    <>
      <ProductSchema 
        name="Butler AI"
        description="AI Hotel Concierge Platform providing automated guest communication, room service routing, and request resolution."
        image="/images/products_pics/Guest view initial landing .png"
        brand="SOYL Cloud"
      />
      <StickyCTA />
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[var(--background-image-gradient-hero)] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[600px] bg-[var(--background-image-gradient-glow)] -z-10" />

        <Container>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="mb-8">
              <Badge variant="outline" dot>AI Hotel Concierge Platform</Badge>
            </motion.div>

            <motion.h1 
              variants={fadeUp}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-soyl-charcoal)] leading-[1.05] mb-8"
            >
              Resolve guest requests in under <span className="text-[var(--color-soyl-mint-dark)]">30 seconds.</span>
            </motion.h1>

            <motion.p 
              variants={fadeUp}
              className="text-xl md:text-2xl text-[var(--color-soyl-gray-600)] mb-12 max-w-3xl leading-relaxed font-medium"
            >
              Butler AI routes room service, housekeeping, and guest communications automatically. No application download required. Integrates immediately.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button size="lg" variant="primary" href="/book-demo" className="w-full sm:w-auto group">
                Book a Demo
                <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" href="#products" className="w-full sm:w-auto">
                <Play size={18} className="mr-2 text-[var(--color-soyl-mint-dark)]" />
                Watch Product Tour
              </Button>
            </motion.div>
          </motion.div>

          {/* Hero Mockups Showcase */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="mt-20 md:mt-32 relative max-w-[1200px] mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-20 h-40 bottom-0 top-auto pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative">
              <div className="w-full md:w-3/5 relative z-10">
                <BrowserMockup 
                  src="/images/soyl_hero_main.png" 
                  alt="PMS Lite Dashboard"
                  glow
                />
              </div>
              <div className="w-[280px] md:w-[320px] md:absolute md:-right-4 lg:right-10 md:bottom-[-40px] z-20">
                <PhoneMockup 
                  src="/images/products_pics/Guest view initial landing .png"
                  alt="Butler AI Guest View"
                  float
                />
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* 2. SUMMARY SECTION (AEO) */}
      <section className="py-12 bg-[var(--color-soyl-gray-50)] border-y border-[var(--color-soyl-gray-200)]">
        <Container>
          <SummaryBlock
            whatItIs="SOYL Cloud is a Hotel Automation Software and AI Hotel Concierge Platform."
            whoItsFor="Hotel operators, general managers, and hospitality staff seeking to digitize guest requests and property management operations."
            howItWorks="Guests access an AI chatbot via QR code to submit requests. The platform processes requests via NLP and routes them to specific staff dashboards (e.g., Housekeeping, Kitchen) for resolution."
            whyItMatters="Reduces front desk call volume, decreases request fulfillment time by automating routing, and eliminates the need for walkie-talkies or paper logs."
          />
        </Container>
      </section>

      {/* 3. METRICS STRIP */}
      <MetricsStrip />

      {/* 4. PRODUCT CAPABILITIES & BUTLER AI */}
      <section id="products" className="py-24 md:py-32 bg-white">
        <Container>
          <SectionHeader
            badge="Butler AI & PMS Lite"
            title="Hotel Automation Software Core Specifications"
            description="Technical details of the AI Hotel Concierge Platform and management dashboard."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 mt-12">
            <div>
              <h3 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-6">Guest vs Staff Capabilities</h3>
              <FactTable 
                title="Capability Matrix"
                headers={["Feature", "Guest Interface", "Staff Interface"]}
                rows={[
                  ["Access Method", "QR Code Scan (Browser)", "Web Dashboard"],
                  ["Interaction Type", "Voice & Text Chat (NLP)", "Kanban/List View Tickets"],
                  ["Language Support", "50+ Languages (Auto-translate)", "Primary Hotel Language"],
                  ["Request Routing", "Automated (AI-classified)", "Manual Assignment/Resolution"],
                  ["Installation", "No app download required", "Cloud-based SaaS"]
                ]}
              />
            </div>
            
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-6">System Features</h3>
              <DefinitionList 
                items={[
                  {
                    term: "Multilingual Processing",
                    definition: "The AI concierge detects user language automatically and translates guest messages into the staff's native language, handling over 50 languages."
                  },
                  {
                    term: "Omnichannel Input",
                    definition: "Supports both voice-to-text and direct text input from the guest interface without requiring third-party app installations."
                  },
                  {
                    term: "Smart Ticket Routing",
                    definition: "Analyzes intent from guest input and assigns tasks directly to corresponding departments (e.g., Food orders to Kitchen, Towels to Housekeeping)."
                  }
                ]}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* 5. ROI / DATA SECTION */}
      <section className="py-24 md:py-32 bg-[var(--color-soyl-gray-50)] border-y border-[var(--color-soyl-gray-200)]">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
                Operational Impact Data
              </h2>
              <p className="text-lg text-[var(--color-soyl-gray-600)] mb-10">
                Implementation of Hotel Automation Software yields measurable reductions in task fulfillment times and resource allocation.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-2xl border border-[var(--color-soyl-gray-200)]">
                  <div className="text-3xl font-extrabold text-[var(--color-soyl-charcoal)] mb-2">₹2.4L</div>
                  <p className="text-sm font-medium text-[var(--color-soyl-gray-600)]">Average monthly operational cost reduction</p>
                </div>
                <div className="p-6 bg-white rounded-2xl border border-[var(--color-soyl-gray-200)]">
                  <div className="text-3xl font-extrabold text-[var(--color-soyl-charcoal)] mb-2">3×</div>
                  <p className="text-sm font-medium text-[var(--color-soyl-gray-600)]">Increase in verified online reviews</p>
                </div>
              </div>
            </div>
            
            <div>
              <FactTable 
                title="Supported Property Types"
                headers={["Category", "Primary Use Case"]}
                rows={[
                  ["Boutique Hotels", "AI Hotel Concierge Platform for high-touch guest service."],
                  ["Resorts & Villas", "Centralized multi-property task management."],
                  ["Hotel Chains", "Cross-property analytics and standardized operations."],
                  ["Restaurants", "QR-based ordering and kitchen ticket routing."]
                ]}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* 6. FINAL CTA */}
      <FinalCTA />
    </>
  );
}
