"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FAQ } from "@/lib/competitors";
import { cn } from "@/lib/utils";

interface FAQSectionProps {
  faqs: FAQ[];
  className?: string;
}

export function FAQSection({ faqs, className }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Generate FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={cn(
                "border rounded-2xl overflow-hidden transition-colors duration-300",
                isOpen
                  ? "bg-white border-[var(--color-soyl-mint)] shadow-sm"
                  : "bg-[var(--color-soyl-gray-50)] border-[var(--color-soyl-gray-200)] hover:border-[var(--color-soyl-gray-300)]"
              )}
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-soyl-mint)] focus-visible:ring-offset-2"
                aria-expanded={isOpen}
              >
                <span className={cn(
                  "font-semibold pr-8",
                  isOpen ? "text-[var(--color-soyl-charcoal)]" : "text-[var(--color-soyl-gray-900)]"
                )}>
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 shrink-0 transition-transform duration-300",
                    isOpen ? "rotate-180 text-[var(--color-soyl-mint-dark)]" : "text-[var(--color-soyl-gray-400)]"
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 text-sm text-[var(--color-soyl-gray-600)] leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
