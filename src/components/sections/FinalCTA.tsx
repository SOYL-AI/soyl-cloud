"use client";

import { Reveal } from "@/components/ui/Reveal";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#0A0D14] py-24 md:py-32 border-t border-white/5">
      {/* Background Glows and Visuals */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-soyl-mint/20 to-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-600/10 to-soyl-mint/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-c5a42a1a8c8e?q=80&w=2000')] bg-cover bg-center opacity-[0.03] mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-transparent to-transparent opacity-80" />
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
