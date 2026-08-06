"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Competitor } from "@/lib/competitors";
import { cn } from "@/lib/utils";

interface ComparisonCardProps {
  competitor: Competitor;
  className?: string;
}

export function ComparisonCard({ competitor, className }: ComparisonCardProps) {
  return (
    <Link href={`/compare/${competitor.slug}`} className="block h-full outline-none group focus-visible:ring-2 focus-visible:ring-[var(--color-soyl-mint)] focus-visible:ring-offset-2 rounded-2xl">
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "h-full bg-white rounded-2xl p-6 border border-[var(--color-soyl-gray-200)] shadow-sm group-hover:shadow-xl group-hover:border-[var(--color-soyl-mint)]/50 transition-all duration-300 flex flex-col relative overflow-hidden",
          className
        )}
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--color-soyl-mint)]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-soyl-mint-light)] flex items-center justify-center shrink-0 border border-[var(--color-soyl-mint)]/20">
              <span className="text-[var(--color-soyl-mint-dark)] font-bold text-xs">S</span>
            </div>
            <span className="text-[var(--color-soyl-gray-400)] text-sm font-medium">vs</span>
            <div className="h-8 px-3 rounded-lg bg-[var(--color-soyl-gray-50)] flex items-center border border-[var(--color-soyl-gray-200)]">
              <span className="text-[var(--color-soyl-charcoal)] font-bold text-sm truncate max-w-[100px]">{competitor.name}</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-[var(--color-soyl-charcoal)] mb-3 group-hover:text-[var(--color-soyl-mint-dark)] transition-colors relative z-10">
          Butler AI vs {competitor.name}
        </h3>
        
        <p className="text-sm text-[var(--color-soyl-gray-600)] leading-relaxed mb-6 flex-1 relative z-10">
          {competitor.shortDescription}
        </p>

        <div className="flex flex-wrap gap-2 mb-6 relative z-10">
          {competitor.focusAreas.slice(0, 2).map((area, idx) => (
            <span key={idx} className="px-2 py-1 bg-[var(--color-soyl-gray-50)] text-[var(--color-soyl-gray-600)] text-xs rounded border border-[var(--color-soyl-gray-200)]">
              {area}
            </span>
          ))}
          {competitor.focusAreas.length > 2 && (
            <span className="px-2 py-1 bg-[var(--color-soyl-gray-50)] text-[var(--color-soyl-gray-400)] text-xs rounded border border-[var(--color-soyl-gray-200)]">
              +{competitor.focusAreas.length - 2} more
            </span>
          )}
        </div>

        <div className="flex items-center text-sm font-semibold text-[var(--color-soyl-charcoal)] group-hover:text-[var(--color-soyl-mint-dark)] transition-colors relative z-10 mt-auto pt-4 border-t border-[var(--color-soyl-gray-100)]">
          Read Comparison
          <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>
    </Link>
  );
}
