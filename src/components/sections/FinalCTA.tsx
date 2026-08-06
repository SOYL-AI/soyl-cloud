"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-soyl-charcoal)] py-24 md:py-32">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-soyl-mint)] opacity-10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <Container className="relative z-10">
        <Reveal className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            The hotels of tomorrow are joining today.
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
            ARIP is accepting a limited number of early properties for the pilot program. Secure your spot and be the first to deploy a real AI digital workforce.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <Button size="lg" variant="secondary" href="/contact" className="w-full sm:w-auto group">
              Join Pilot Waitlist
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
