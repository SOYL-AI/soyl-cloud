"use client";

import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DefinitionList, FactTable } from "@/components/seo/AEOBlocks";

const definitionList = [
  { term: "Mission", definition: "To deploy reliable voice AI infrastructure for hospitality properties, reducing front-desk workload and providing instant guest assistance." },
  { term: "SOYL Cloud", definition: "Our core platform combining conversational AI models with hotel property management system integrations." },
  { term: "Target Customers", definition: "Independent hotels, resort properties, and hospitality chains with 20 to 500 room capacities." },
];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SOYL AI",
  "legalName": "SOYL pvt Limited",
  "url": "https://soyl-cloud.com",
  "logo": "https://soyl-cloud.com/logo.png",
  "foundingDate": "2026-02",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Bengaluru",
    "addressCountry": "IN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["English"]
  }
};

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col pt-24 pb-16 bg-[var(--color-soyl-white)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      
      <Container size="lg">
        {/* HERO */}
        <section className="pt-16 pb-12 md:pt-24 text-center">
          <Badge variant="primary" className="mb-6 mx-auto inline-flex items-center gap-1">
            Corporate Information
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-6">
            About SOYL AI
          </h1>
          <p className="text-xl text-[var(--color-soyl-gray-600)] max-w-3xl mx-auto leading-relaxed mb-12">
            SOYL AI (SOYL pvt Limited) develops voice AI infrastructure for the hospitality sector. Headquartered in Bengaluru, India, we build enterprise-grade communication solutions for hotels and resorts globally.
          </p>
        </section>

        {/* FACTUAL SUMMARY */}
        <section className="py-12 border-t border-[var(--color-soyl-gray-200)]">
          <SectionHeader title="Corporate Overview" align="center" className="mb-8" />
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <FactTable
                title="Company Facts"
                headers={["Fact", "Details"]}
                rows={[
                  ["Entity Name", "SOYL AI (SOYL pvt Limited)"],
                  ["Headquarters", "Bengaluru, India"],
                  ["Founded", "February 2026"],
                  ["Primary Product", "SOYL Cloud (Voice AI for Hospitality)"],
                  ["Target Market", "Hotels, Resorts, and Serviced Apartments (20-500 rooms)"],
                  ["Regions Served", "Global (Active in India, UAE, UK)"]
                ]}
              />
            </div>
            <div>
              <DefinitionList
                title="Key Definitions"
                items={definitionList}
              />
            </div>
          </div>
        </section>

        {/* MISSION & OPERATIONS */}
        <section className="py-16 border-t border-[var(--color-soyl-gray-200)]">
          <div className="prose prose-lg text-[var(--color-soyl-gray-600)] max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[var(--color-soyl-charcoal)] mb-6 text-center">Mission and Operations</h2>
            <p className="mb-6">
              SOYL AI's mission is to provide highly available voice AI systems that handle routine guest inquiries, allowing hospitality staff to focus on high-value interactions.
            </p>
            <p className="mb-6">
              Our infrastructure is engineered for hotels, resorts, and serviced apartments ranging from 20 to 500 rooms. We integrate directly with existing Property Management Systems (PMS) to enable real-time, context-aware responses to guest requests.
            </p>
            <p className="mb-6">
              While our research and development center operates out of Bengaluru, India, our software is actively deployed in properties across India, the United Arab Emirates (UAE), and the United Kingdom (UK).
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="bg-[var(--color-soyl-charcoal)] rounded-[32px] p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--gradient-mint)] opacity-10" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Contact SOYL AI</h2>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                For sales inquiries, partnerships, or technical documentation regarding SOYL Cloud deployments.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="primary" size="lg" href="/book-demo" className="bg-[var(--color-soyl-mint)] text-[var(--color-soyl-charcoal)] hover:bg-[var(--color-soyl-mint-light)]">
                  Request Information
                </Button>
                <Button variant="outline" size="lg" href="/contact" className="bg-transparent border-gray-600 text-white hover:bg-white/10 hover:text-white">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
