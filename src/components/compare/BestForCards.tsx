"use client";

import React from "react";
import { motion } from "framer-motion";
import { Building2, Hotel, MapPin } from "lucide-react";
import { BestFor } from "@/lib/competitors";
import { cn } from "@/lib/utils";

interface BestForCardsProps {
  bestFor: BestFor[];
  className?: string;
}

export function BestForCards({ bestFor, className }: BestForCardsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "Enterprise Hotels":
        return <Building2 className="w-6 h-6 text-blue-500" />;
      case "Boutique Hotels":
        return <Hotel className="w-6 h-6 text-purple-500" />;
      case "Independent Hotels":
        return <MapPin className="w-6 h-6 text-emerald-500" />;
      default:
        return <Hotel className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {bestFor.map((item, idx) => (
        <motion.div
          key={idx}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl border border-[var(--color-soyl-gray-200)] p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--color-soyl-gray-50)] flex items-center justify-center mb-4 border border-[var(--color-soyl-gray-100)]">
            {getIcon(item.type)}
          </div>
          <h3 className="text-lg font-bold text-[var(--color-soyl-charcoal)] mb-3">
            {item.type}
          </h3>
          <p className="text-sm text-[var(--color-soyl-gray-600)] leading-relaxed">
            {item.recommendation}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
