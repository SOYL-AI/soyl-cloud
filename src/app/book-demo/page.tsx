"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { fadeUp } from "@/lib/animations";

export default function BookDemo() {
  return (
    <div className="flex flex-col min-h-screen pt-32 pb-24 bg-[var(--color-soyl-gray-50)]">
      <Container>
        <div className="max-w-3xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-10 md:p-16 shadow-xl border border-[var(--color-soyl-gray-200)]"
          >
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] mb-4">Book Your Free Demo</h1>
              <p className="text-[var(--color-soyl-gray-600)] text-lg">See how SOYL Cloud can transform your property's operations.</p>
            </div>

            <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">First Name</label>
                  <input type="text" className="px-4 py-3 rounded-xl border border-[var(--color-soyl-gray-200)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint)] focus:border-transparent transition-all" placeholder="Jane" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Last Name</label>
                  <input type="text" className="px-4 py-3 rounded-xl border border-[var(--color-soyl-gray-200)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint)] focus:border-transparent transition-all" placeholder="Doe" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Work Email</label>
                <input type="email" className="px-4 py-3 rounded-xl border border-[var(--color-soyl-gray-200)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint)] focus:border-transparent transition-all" placeholder="jane@hotel.com" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Property Name</label>
                <input type="text" className="px-4 py-3 rounded-xl border border-[var(--color-soyl-gray-200)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint)] focus:border-transparent transition-all" placeholder="Grand Plaza Hotel" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">Product Interest</label>
                <select className="px-4 py-3 rounded-xl border border-[var(--color-soyl-gray-200)] focus:outline-none focus:ring-2 focus:ring-[var(--color-soyl-mint)] focus:border-transparent transition-all bg-white">
                  <option>Butler AI</option>
                  <option>PMS Lite</option>
                  <option>SOYL Dine</option>
                  <option>Full Suite</option>
                </select>
              </div>

              <div className="mt-4">
                <Button size="lg" className="w-full">
                  Request Demo
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
