"use client";

import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="flex flex-col pt-32 pb-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold tracking-tight text-[var(--color-charcoal)] mb-6">About SOYL AI</h1>
          <p className="text-xl text-gray-600 leading-relaxed text-balance">
            We are building the operating system for modern hospitality.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="prose prose-lg prose-gray max-w-none text-gray-700"
        >
          <p className="mb-6">
            SOYL AI Private Limited was founded with a single mission: to eliminate the friction between hospitality teams and the technology they use every day.
          </p>
          <p className="mb-6">
            For decades, hotels and restaurants have been forced to piece together fragmented, legacy software systems that are difficult to learn, expensive to maintain, and fundamentally disconnected from the modern guest experience. We believe hospitality teams deserve better.
          </p>
          <p className="mb-6">
            By leveraging artificial intelligence and modern cloud architecture, we've built a unified suite of tools—Butler AI, PMS Lite, and SOYL Dine—that feels as intuitive as the consumer apps you use every day, while possessing the enterprise-grade power required to run complex properties.
          </p>
          <h2 className="text-2xl font-bold text-[var(--color-charcoal)] mt-12 mb-4">Our Values</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Simplicity over complexity:</strong> Software should be invisible, letting staff focus on guests.</li>
            <li><strong>Design matters:</strong> Beautiful tools are easier to learn and more pleasant to use.</li>
            <li><strong>Transparent partnership:</strong> No hidden fees, no opaque contracts. We grow when you grow.</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
