"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";

/**
 * One header shape for every workspace page.
 *
 * Consistency here is not decoration: a person moving between Overview and
 * Documents should never have to re-find where the title, the count and the
 * action live. Pages that each invent their own arrangement feel like separate
 * products stitched together.
 *
 * The entrance is short — 0.35s against the marketing site's 0.6s. A landing
 * page is being read; a workspace is being used, and animation you wait for
 * twenty times a day stops being delightful very quickly.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mb-8 flex flex-wrap items-end justify-between gap-6"
    >
      <div className="min-w-0">
        <Badge variant="secondary" className="mb-4 inline-flex">
          {eyebrow}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[var(--color-soyl-gray-600)]">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

/** The page body, so padding and width are decided once. */
export function PageBody({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10 lg:py-12">{children}</main>
  );
}
