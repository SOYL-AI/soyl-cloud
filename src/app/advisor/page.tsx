import { FileText, MessagesSquare, Quote } from "lucide-react";

import { AdvisorChat } from "@/components/advisor/AdvisorChat";
import { Container } from "@/components/ui/Container";

/**
 * The Hotel Advisor page.
 *
 * Deliberately quiet around the chat. Someone arriving here has already
 * clicked a button saying they want to try it, so the job is to get out of the
 * way — a page of copy above the thing they came for is the most common way to
 * lose someone who was already interested.
 *
 * The "how it works" strip sits *below* the chat rather than above it for the
 * same reason. It answers the question people have after their first answer,
 * not before it.
 */

const STEPS = [
  {
    icon: MessagesSquare,
    title: "Tell it about your property",
    body: "Five questions, all multiple choice bar the last. Under a minute.",
  },
  {
    icon: FileText,
    title: "Upload what your team already asks about",
    body: "SOPs, supplier contracts, brand standards, the safety plan. PDFs are fine.",
  },
  {
    icon: Quote,
    title: "Ask, and check the source",
    body: "Every answer quotes the passage behind it. When nothing covers a question, it says so.",
  },
];

export default function AdvisorPage() {
  return (
    <main className="bg-cream py-16 sm:py-20">
      <Container>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/45">
            Hotel Advisor
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-charcoal sm:text-4xl">
            Where does your team lose time to paperwork?
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal/65">
            Answer five questions and get a straight read on your operation. No
            account, no email, no call.
          </p>
        </div>

        <AdvisorChat />

        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-[0.14em] text-charcoal/45">
            How the real thing works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="rounded-2xl border border-charcoal/10 bg-white p-5"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint/25 text-xs font-semibold text-charcoal">
                      {index + 1}
                    </span>
                    <Icon className="h-4 w-4 text-charcoal/45" aria-hidden />
                  </div>
                  <h3 className="text-sm font-semibold text-charcoal">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal/65">
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </main>
  );
}
