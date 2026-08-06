import React from "react";
import { Check, Minus } from "lucide-react";
import { FeatureCategory } from "@/lib/competitors";

interface ComparisonTableProps {
  categories: FeatureCategory[];
  competitorName: string;
}

export function ComparisonTable({ categories, competitorName }: ComparisonTableProps) {
  const renderStatus = (status: true | false | "partial" | "Contact Vendor" | string) => {
    if (status === true) {
      return (
        <div className="flex items-center justify-center">
          <Check className="w-5 h-5 text-[var(--color-soyl-success)]" />
        </div>
      );
    }
    if (status === false) {
      return (
        <div className="flex items-center justify-center">
          <Minus className="w-5 h-5 text-[var(--color-soyl-gray-400)]" />
        </div>
      );
    }
    if (status === "partial") {
      return (
        <div className="flex items-center justify-center">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-soyl-warning)]/10 text-[var(--color-soyl-warning)] border border-[var(--color-soyl-warning)]/20">
            Partial
          </span>
        </div>
      );
    }
    if (status === "Contact Vendor") {
      return (
        <div className="flex items-center justify-center text-center">
          {/* Synthesised italic. The real italic face is a separate 48 KB
              font file, which is not worth loading on every page for one cell. */}
          <span className="text-sm italic text-[var(--color-soyl-gray-400)]">
            Contact Vendor
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center text-center">
        <span className="text-sm font-medium text-[var(--color-soyl-charcoal)]">{status}</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-[var(--color-soyl-gray-200)] overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr>
              <th className="sticky left-0 z-20 bg-white/95 backdrop-blur-md p-4 md:p-6 w-1/3 md:w-2/5 text-sm font-semibold text-[var(--color-soyl-gray-600)] uppercase tracking-wider border-b border-[var(--color-soyl-gray-200)] shadow-[1px_0_0_var(--color-soyl-gray-200)]">
                Feature
              </th>
              <th className="p-4 md:p-6 w-1/3 md:w-[30%] text-center border-b border-[var(--color-soyl-gray-200)] border-l border-[var(--color-soyl-gray-100)]">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded bg-[var(--color-soyl-mint-light)] flex items-center justify-center shrink-0">
                    <span className="text-[var(--color-soyl-mint-dark)] font-bold text-[10px]">S</span>
                  </div>
                  <span className="font-bold text-[var(--color-soyl-charcoal)] text-base md:text-lg">Butler AI</span>
                </div>
              </th>
              <th className="p-4 md:p-6 w-1/3 md:w-[30%] text-center border-b border-[var(--color-soyl-gray-200)] border-l border-[var(--color-soyl-gray-100)]">
                <span className="font-bold text-[var(--color-soyl-gray-600)] text-base md:text-lg">{competitorName}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-soyl-gray-100)]">
            {categories.map((category, catIdx) => (
              <React.Fragment key={catIdx}>
                {/* Category Header */}
                <tr className="bg-[var(--color-soyl-gray-50)]">
                  <td
                    colSpan={3}
                    className="sticky left-0 z-10 px-4 md:px-6 py-3 text-sm font-bold text-[var(--color-soyl-charcoal)] border-l-4 border-[var(--color-soyl-mint)]"
                  >
                    {category.category}
                  </td>
                </tr>
                {/* Features */}
                {category.features.map((feature, featIdx) => (
                  <tr
                    key={featIdx}
                    className="group transition-colors hover:bg-[var(--color-soyl-gray-50)]/50"
                  >
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[var(--color-soyl-gray-50)]/50 px-4 md:px-6 py-4 text-sm font-medium text-[var(--color-soyl-charcoal)] shadow-[1px_0_0_var(--color-soyl-gray-100)] transition-colors">
                      {feature.name}
                    </td>
                    <td className="px-4 py-4 border-l border-[var(--color-soyl-gray-100)]">
                      {renderStatus(feature.butler)}
                    </td>
                    <td className="px-4 py-4 border-l border-[var(--color-soyl-gray-100)] bg-[var(--color-soyl-gray-50)]/30">
                      {renderStatus(feature.competitor)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
