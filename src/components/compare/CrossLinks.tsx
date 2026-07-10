import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { competitors } from "@/lib/competitors";
import { cn } from "@/lib/utils";

interface CrossLinksProps {
  currentCompetitorSlug: string;
  className?: string;
}

export function CrossLinks({ currentCompetitorSlug, className }: CrossLinksProps) {
  const otherCompetitors = competitors.filter((c) => c.slug !== currentCompetitorSlug);

  return (
    <div className={cn("w-full bg-[var(--color-soyl-gray-50)] rounded-3xl p-8 md:p-12 border border-[var(--color-soyl-gray-200)]", className)}>
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-[var(--color-soyl-charcoal)] mb-8 text-center">
          Compare Butler AI with other platforms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {otherCompetitors.map((competitor) => (
            <Link
              key={competitor.slug}
              href={`/compare/${competitor.slug}`}
              className="flex items-center justify-between p-4 rounded-xl bg-white border border-[var(--color-soyl-gray-200)] hover:border-[var(--color-soyl-mint)]/50 hover:shadow-sm transition-all group"
            >
              <span className="font-medium text-[var(--color-soyl-gray-600)] group-hover:text-[var(--color-soyl-charcoal)] transition-colors">
                vs {competitor.name}
              </span>
              <ChevronRight className="w-4 h-4 text-[var(--color-soyl-gray-400)] group-hover:text-[var(--color-soyl-mint)] group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
