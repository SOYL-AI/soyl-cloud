import { ArrowRight } from "lucide-react";

import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { Reveal } from "../ui/Reveal";

interface FinalCTAProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function FinalCTA({
  eyebrow = "See it with your own workflow",
  title = "Give your team fewer handoffs — and more time for guests.",
  description = "Bring us one recurring guest request. We’ll show you how SOYL can turn it into a clear, trackable workflow.",
  primaryLabel = "Book a product walkthrough",
  primaryHref = "/book-demo",
  secondaryLabel,
  secondaryHref,
}: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[#09100f] py-20 text-white md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(109,186,178,0.2),transparent_34%),radial-gradient(circle_at_12%_90%,rgba(59,130,246,0.1),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:48px_48px]" />

      <Container className="relative">
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-soyl-mint">
            {eyebrow}
          </p>
          <h2 className="max-w-3xl text-balance text-4xl font-bold tracking-[-0.035em] text-white md:text-6xl">
            {title}
          </h2>
          <p className="mt-6 max-w-2xl text-balance text-lg leading-8 text-white/65">
            {description}
          </p>
          <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              href={primaryHref}
              className="group w-full border border-soyl-mint/60 px-7 sm:w-auto"
            >
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Button>
            {secondaryLabel && secondaryHref ? (
              <Button
                size="lg"
                href={secondaryHref}
                variant="outline"
                className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                {secondaryLabel}
              </Button>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
