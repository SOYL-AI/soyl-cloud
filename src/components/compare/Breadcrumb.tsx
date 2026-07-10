import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  // Generate BreadcrumbList Schema for SEO
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? `https://soyl.cloud${item.href}` : undefined,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={cn("flex", className)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ol className="flex items-center space-x-1 md:space-x-2 flex-wrap">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="text-xs md:text-sm font-medium text-[var(--color-soyl-gray-500)] hover:text-[var(--color-soyl-charcoal)] transition-colors"
          >
            Home
          </Link>
        </li>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-4 h-4 text-[var(--color-soyl-gray-400)] mx-1" />
              {isLast || !item.href ? (
                <span className="text-xs md:text-sm font-medium text-[var(--color-soyl-charcoal)]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-xs md:text-sm font-medium text-[var(--color-soyl-gray-500)] hover:text-[var(--color-soyl-charcoal)] transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
