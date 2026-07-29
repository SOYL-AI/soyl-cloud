"use client";

import * as React from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /**
   * Heading level to render. Defaults to `h2`, which is right when this is a
   * section heading inside a page that has its own `<h1>`.
   *
   * Pass `as="h1"` when this component *is* the page title — `/blog`,
   * `/compare`, `/faq`, `/company` and `/security` do, and shipped without an
   * `<h1>` at all until this prop existed. Typography is identical either way;
   * only the tag changes.
   */
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export function SectionHeader({
  badge,
  title,
  description,
  align = "center",
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4 mb-16",
        align === "center" ? "items-center text-center mx-auto max-w-3xl" : "items-start max-w-2xl",
        className
      )}
    >
      {badge && <Badge variant="secondary">{badge}</Badge>}
      <Heading className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-soyl-charcoal)]">
        {title}
      </Heading>
      {description && (
        <p className="text-lg md:text-xl text-[var(--color-soyl-gray-600)] leading-relaxed">
          {description}
        </p>
      )}
    </Reveal>
  );
}
