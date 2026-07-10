import React from "react";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerdictBoxProps {
  competitorStrength: string;
  butlerStrength: string;
  competitorName: string;
  className?: string;
}

export function VerdictBox({ competitorStrength, butlerStrength, competitorName, className }: VerdictBoxProps) {
  return (
    <div className={cn("relative overflow-hidden bg-[var(--color-soyl-mint-light)] rounded-2xl border border-[var(--color-soyl-mint)]/30 p-6 md:p-8", className)}>
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--color-soyl-mint)]" />
      
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-[var(--color-soyl-mint)]/20">
          <Scale className="w-5 h-5 text-[var(--color-soyl-mint-dark)]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[var(--color-soyl-charcoal)] mb-1">
            The Verdict
          </h3>
          <p className="text-sm text-[var(--color-soyl-mint-dark)] font-medium">
            Butler AI vs {competitorName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <div className="space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-soyl-gray-600)]">
            When to choose {competitorName}
          </h4>
          <p className="text-base text-[var(--color-soyl-charcoal)] leading-relaxed">
            {competitorStrength}
          </p>
        </div>
        <div className="space-y-2 relative">
          <div className="hidden md:block absolute -left-5 top-0 bottom-0 w-px bg-[var(--color-soyl-mint)]/20" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-soyl-mint-dark)]">
            When to choose Butler AI
          </h4>
          <p className="text-base font-medium text-[var(--color-soyl-charcoal)] leading-relaxed">
            {butlerStrength}
          </p>
        </div>
      </div>
    </div>
  );
}
