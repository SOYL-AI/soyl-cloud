"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";

export default function BookDemo() {
  return (
    <div className="flex flex-col min-h-screen pt-32 pb-24 bg-[var(--color-soyl-gray-50)]">
      <Container>
        <div className="max-w-4xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-[var(--color-soyl-gray-200)]"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-4">Book Your Free Demo</h1>
              <p className="text-[var(--color-soyl-gray-600)] text-lg">See how SOYL Cloud can transform your property's operations.</p>
            </div>

            <div className="w-full h-[700px] rounded-xl overflow-hidden">
              <iframe 
                src="https://calendly.com/siddharthpriyatam/30min"
                width="100%"
                height="100%"
                frameBorder="0"
                title="Book a Demo via Calendly"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
