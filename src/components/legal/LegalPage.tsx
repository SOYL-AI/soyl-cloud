import type { ReactNode } from "react";

import { Container } from "@/components/ui/Container";

/**
 * The frame every legal page sits in.
 *
 * Shared so the three documents cannot drift in typography, heading structure
 * or the "last updated" line. Legal pages are read by people looking for a
 * specific clause, so the typographic job is scannability rather than beauty:
 * generous heading contrast, numbered sections, and a readable measure.
 *
 * Server-rendered with no client JavaScript at all. Nothing here is
 * interactive, and a policy page is exactly the kind of route that quietly
 * accumulates a bundle for no reason.
 */

export function LegalPage({
  title,
  summary,
  updated,
  children,
}: {
  title: string;
  /**
   * A plain-language sentence at the top. Not a substitute for the document,
   * but the thing most readers actually want — and writing one forces the
   * document underneath to be honest, because a summary you cannot write
   * without hedging usually means the terms need changing rather than the
   * summary.
   */
  summary: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white pb-24 pt-32">
      <Container>
        <article className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] sm:text-4xl">
            {title}
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-[var(--color-soyl-gray-600)]">
            {summary}
          </p>

          <p className="mt-4 text-sm text-[var(--color-soyl-gray-500)]">
            Last updated {updated}
          </p>

          <div className="legal-body mt-10">{children}</div>
        </article>
      </Container>
    </main>
  );
}

/**
 * One numbered section.
 *
 * Numbered because these documents get cited in email — "clause 4.2" has to
 * mean something, and a heading nobody can reference is a heading somebody has
 * to quote in full instead.
 */
export function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  const id = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <section className="mt-10 scroll-mt-32" id={id} aria-labelledby={`${id}-heading`}>
      <h2
        id={`${id}-heading`}
        className="text-xl font-semibold text-[var(--color-soyl-charcoal)]"
      >
        <span className="mr-2 text-[var(--color-soyl-gray-400)]">{number}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[var(--color-soyl-gray-600)]">
        {children}
      </div>
    </section>
  );
}
