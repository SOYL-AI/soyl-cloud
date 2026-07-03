"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

import { HTMLMotionProps } from "framer-motion";

interface SectionHeaderProps extends HTMLMotionProps<"div"> {
  badge?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  badge,
  title,
  description,
  align = "center",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={cn(
        "flex flex-col gap-4 mb-16",
        align === "center" ? "items-center text-center mx-auto max-w-3xl" : "items-start max-w-2xl",
        className
      )}
      {...props}
    >
      {badge && <Badge variant="secondary">{badge}</Badge>}
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--color-soyl-charcoal)]">
        {title}
      </h2>
      {description && (
        <p className="text-lg md:text-xl text-[var(--color-soyl-gray-600)] leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
}
