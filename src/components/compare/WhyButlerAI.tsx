"use client";

import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { BUTLER_STRENGTHS } from "@/lib/competitors";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface WhyButlerAIProps {
  className?: string;
}

export function WhyButlerAI({ className }: WhyButlerAIProps) {
  // Helper to dynamically render Lucide icons by string name
  const renderIcon = (iconName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[iconName];
    if (!IconComponent) return <Icons.Check className="w-6 h-6" />;
    return <IconComponent className="w-6 h-6 text-[var(--color-soyl-mint-dark)]" />;
  };

  return (
    <div className={cn("w-full", className)}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {BUTLER_STRENGTHS.map((strength, idx) => (
          <motion.div
            key={idx}
            variants={staggerItem}
            className="bg-white rounded-2xl p-6 border border-[var(--color-soyl-gray-200)] shadow-sm hover:shadow-md hover:border-[var(--color-soyl-mint)]/30 transition-all flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-soyl-mint-light)] flex items-center justify-center mb-5 shrink-0 border border-[var(--color-soyl-mint)]/20">
              {renderIcon(strength.icon)}
            </div>
            <h3 className="text-lg font-bold text-[var(--color-soyl-charcoal)] mb-3 leading-tight">
              {strength.title}
            </h3>
            <p className="text-sm text-[var(--color-soyl-gray-600)] leading-relaxed flex-1">
              {strength.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
