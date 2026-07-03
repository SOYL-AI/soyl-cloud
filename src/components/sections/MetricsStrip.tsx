"use client";

import { Container } from "../ui/Container";
import { AnimatedCounter } from "../ui/AnimatedCounter";

export function MetricsStrip() {
  return (
    <section className="py-24 bg-[var(--color-soyl-gray-50)] border-y border-gray-100">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedCounter
            value={90}
            suffix="%"
            label="Reduction in front desk calls"
            duration={2.5}
          />
          <AnimatedCounter
            value={45}
            suffix="%"
            label="Faster response time"
            duration={2}
          />
          <AnimatedCounter
            value={5}
            suffix="×"
            label="Guest satisfaction"
            duration={2.5}
          />
          <AnimatedCounter
            value={24}
            suffix="/7"
            label="AI help availability"
            duration={1.5}
          />
        </div>
      </Container>
    </section>
  );
}
