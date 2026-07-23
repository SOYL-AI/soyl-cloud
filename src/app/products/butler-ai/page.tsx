"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SummaryBlock, DefinitionList, FactTable } from "@/components/seo/AEOBlocks";
import { ProductSchema, FAQSchema } from "@/components/seo/SchemaInjector";
import { StickyCTA } from "@/components/sections/StickyCTA";
import { FinalCTA } from "@/components/sections/FinalCTA";

const faqs = [
  {
    question: "What is Butler AI?",
    answer: "Butler AI is an AI Hotel Concierge Platform that handles guest requests via voice and chat, routing tasks automatically to hotel staff."
  },
  {
    question: "Who is it for?",
    answer: "It is for hotels, resorts, and hospitality businesses looking to automate guest services and staff task management."
  },
  {
    question: "How does it work?",
    answer: "Guests scan a QR code to access the platform. They submit requests via voice or chat. The AI interprets the request and routes it to the relevant staff department dashboard."
  },
  {
    question: "Why does it matter?",
    answer: "It reduces staff response times, supports 50+ languages natively, eliminates app downloads, and increases guest satisfaction."
  }
];

export default function ButlerAIPage() {
  return (
    <div className="flex flex-col">
      <ProductSchema 
        name="Butler AI" 
        description="AI Hotel Concierge Platform for automated guest service and task routing." 
        category="SoftwareApplication" 
      />
      <FAQSchema faqs={faqs} />
      
      <StickyCTA title="Butler AI — AI Hotel Concierge Platform" />

      <section className="pt-32 pb-20 bg-gray-50">
        <Container>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Butler AI: AI Hotel Concierge Platform</h1>
            
            <SummaryBlock 
              question="What is Butler AI?"
              answer="Butler AI is an AI Hotel Concierge Platform. It allows hotel guests to make requests via voice or chat without downloading an app. The system automatically routes these requests to the appropriate staff members. It acts as a digital interface between guests and hotel operations."
            />
            
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Core Capabilities</h2>
              <DefinitionList 
                items={[
                  { term: "Access Method", definition: "QR code scan. No app download required." },
                  { term: "Input Modes", definition: "Natural language voice and text chat." },
                  { term: "Task Routing", definition: "Automated assignment to designated staff departments." },
                  { term: "Language Support", definition: "Real-time translation for 50+ languages." }
                ]}
              />
            </div>
            
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Technical Specifications</h2>
              <FactTable 
                headers={["Feature", "Specification"]}
                rows={[
                  ["Platform Type", "Web-based (Progressive Web App)"],
                  ["Integration", "Direct connection to staff dashboard"],
                  ["Emergency Support", "SOS one-tap alerts to property management"],
                  ["Additional Functions", "Room service ordering, AI voice call scheduling, smart upselling"]
                ]}
              />
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Frequently Asked Questions</h2>
              <dl className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <dt className="font-semibold text-gray-900 mb-2">{faq.question}</dt>
                    <dd className="text-gray-600">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>

          </motion.div>
        </Container>
      </section>

      <FinalCTA />
    </div>
  );
}
