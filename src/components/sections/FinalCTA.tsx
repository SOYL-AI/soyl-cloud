"use client";

import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-soyl-charcoal)] py-24 md:py-32">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-soyl-mint)] opacity-10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <Container className="relative z-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col items-center text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            Ready to modernize your property?
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
            Join forward-thinking hotels that chose SOYL Cloud to power their guest experience and automate their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" variant="secondary" href="/book-demo" className="w-full sm:w-auto group">
              Book Your Free Demo
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
            </Button>
            <Button size="lg" variant="outline" href="/contact" className="w-full sm:w-auto border-gray-600 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Contact Sales
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
