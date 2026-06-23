"use client";

import { motion } from "framer-motion";

export default function BookDemo() {
  return (
    <div className="flex flex-col min-h-screen pt-32 pb-24 bg-[var(--color-light-grey)]">
      <div className="max-w-3xl mx-auto px-6 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-10 md:p-16 shadow-xl border border-gray-100"
        >
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-charcoal)] mb-4">Book Your Free Demo</h1>
            <p className="text-gray-600 text-lg">See how SOYL AI can transform your property's operations.</p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">First Name</label>
                <input type="text" className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition-all" placeholder="John" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Last Name</label>
                <input type="text" className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition-all" placeholder="Doe" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Work Email</label>
              <input type="email" className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition-all" placeholder="john@hotel.com" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Property Name</label>
              <input type="text" className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition-all" placeholder="Grand Plaza Hotel" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Product Interest</label>
              <select className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)] transition-all bg-white">
                <option>Butler AI</option>
                <option>PMS Lite</option>
                <option>SOYL Dine</option>
                <option>Full Suite</option>
              </select>
            </div>

            <button className="mt-4 bg-[var(--color-charcoal)] text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-black transition-all w-full">
              Request Demo
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
