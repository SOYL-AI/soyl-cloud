import { CheckCircle2 } from "lucide-react";

import { CalendlyFacade } from "@/components/booking/CalendlyFacade";
import { Container } from "@/components/ui/Container";

/**
 * The demo booking page.
 *
 * A server component now. It was `"use client"` for one `useEffect` listening
 * to Calendly, which meant the whole page — heading, copy, layout — shipped and
 * hydrated as a client bundle to support a listener that only matters after
 * someone clicks. That listener moved into the facade island, and nothing else
 * here needs JavaScript.
 *
 * `UPDATE.md` §10: marketing routes are RSC with no client-side data fetching
 * for primary content.
 */

const INCLUDED = [
  "A walk through your own operation, not a canned script",
  "The product answering questions against a document like one of yours",
  "Straight answers on pricing, data handling, and what it will not do",
];

export default function BookDemo() {
  return (
    <main className="min-h-screen bg-[var(--color-soyl-gray-50)] pb-24 pt-32">
      <Container>
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] sm:text-4xl">
              Book a demo
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-[var(--color-soyl-gray-600)]">
              Thirty minutes with someone who built this, not a sales script.
            </p>
          </div>

          <ul className="mx-auto mb-8 max-w-xl space-y-2">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-[var(--color-soyl-gray-600)]"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-soyl-mint-dark)]"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>

          <CalendlyFacade />
        </div>
      </Container>
    </main>
  );
}
