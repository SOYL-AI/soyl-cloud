import { ArrowRight, BookOpen, MessageSquareText, Quote, Search } from "lucide-react";
import Link from "next/link";

import { RevealGroup } from "@/components/ui/Reveal";
import { Container } from "@/components/ui/Container";

/**
 * The Hotel Advisor entry point on the landing page.
 *
 * Someone scrolling past the hero should be able to *see* what asking a
 * document looks like before deciding whether to try it. So the visual is a
 * real answer — question, cited quote, source line — rather than an
 * illustration of one. It is the clearest way to communicate the thing that
 * makes this different from a chatbot: the citation.
 *
 * The mock answer uses obviously generic policy wording. It is a diagram of the
 * interface, not a claim about anybody's documents, and inventing a
 * realistic-looking hotel's policy here would be the same mistake the advisor
 * itself is built to avoid.
 */

const STEPS = [
  { icon: Search, label: "It searches your documents" },
  { icon: Quote, label: "It quotes the exact passage" },
  { icon: BookOpen, label: "You check the source in one click" },
];

export function AdvisorTeaser() {
  return (
    <section
      id="advisor"
      className="border-y border-charcoal/10 bg-cream py-16 sm:py-24"
    >
      <Container>
        <RevealGroup className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/45">
              Hotel Advisor
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-charcoal sm:text-4xl">
              Your SOPs can answer questions.
              <br className="hidden sm:block" /> Right now they just sit there.
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-charcoal/65">
              Every hotel already has the answers written down — in the SOP, the
              supplier contract, the safety plan. The cost is not that nobody wrote
              them. It is that finding them takes a person ten minutes and a phone
              call.
            </p>

            <ul className="mt-6 space-y-3">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.label} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mint/25">
                      <Icon className="h-4 w-4 text-charcoal" aria-hidden />
                    </span>
                    <span className="text-[15px] text-charcoal/75">{step.label}</span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/advisor"
                className="group inline-flex items-center gap-2 rounded-xl bg-charcoal px-5 py-3 text-sm font-semibold text-white transition hover:bg-charcoal/90"
              >
                <MessageSquareText className="h-4 w-4" aria-hidden />
                Try the Hotel Advisor
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <span className="text-sm text-charcoal/50">
                Five questions. No account.
              </span>
            </div>
          </div>

          <div>
            <AnswerPreview />
          </div>
        </RevealGroup>
      </Container>
    </section>
  );
}

/**
 * A static picture of a cited answer.
 *
 * Not a live demo: a real call on the landing page would cost money per scroll
 * and would be the slowest element on the page. This shows the shape, and the
 * button next to it goes to the thing that actually runs.
 */
function AnswerPreview() {
  return (
    <div className="rounded-3xl border border-charcoal/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex justify-end">
        <p className="rounded-2xl rounded-br-md bg-charcoal px-4 py-2 text-sm text-white">
          Can a corporate guest cancel free the day before?
        </p>
      </div>

      <p className="mb-3 text-[15px] font-semibold leading-snug text-charcoal">
        No — inside 48 hours one night is charged to the company account.
      </p>

      <p className="mb-4 text-sm leading-relaxed text-charcoal/75">
        The window is measured from 14:00 on the arrival date, so a booking withdrawn
        the previous evening falls inside it.
      </p>

      <figure className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.03] p-4">
        <Quote className="mb-2 h-3.5 w-3.5 text-charcoal/40" aria-hidden />
        <blockquote className="text-[13px] leading-relaxed text-charcoal/75">
          &ldquo;A room booked under a corporate contracted rate may be withdrawn
          without charge up to 48 hours before the arrival date.&rdquo;
        </blockquote>
        <figcaption className="mt-3 border-t border-charcoal/10 pt-2 text-[11px] text-charcoal/55">
          Front Office SOP · Cancellation and no-show
        </figcaption>
      </figure>

      <div className="mt-4 flex items-center gap-2 border-t border-charcoal/10 pt-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 px-2.5 py-1 text-[11px] font-medium text-charcoal/70">
          <BookOpen className="h-3 w-3" aria-hidden />1 source
        </span>
        <span className="text-[11px] text-charcoal/45">
          Illustration of the interface
        </span>
      </div>
    </div>
  );
}
