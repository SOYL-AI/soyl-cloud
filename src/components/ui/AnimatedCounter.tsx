"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A number that counts up when it scrolls into view.
 *
 * This was the only thing on the site using GSAP — a whole animation library
 * plus its ScrollTrigger plugin, shipped on every page that imports this, to
 * tween one integer. `BASELINE.md` flagged two animation libraries as dead
 * weight; framer-motion does the rest of the work, so GSAP goes.
 *
 * What replaces it is `IntersectionObserver` and `requestAnimationFrame`, both
 * native. The easing is the same cubic ease-out GSAP's `power2.out` uses, so
 * the animation is unchanged to look at.
 *
 * **It renders the final number on the server**, then counts up from zero once
 * the browser takes over. The old version rendered a literal `0` in the HTML,
 * which meant anyone with JavaScript disabled, any crawler that does not
 * execute scripts, and every reader using a screen reader before hydration saw
 * a statistic of zero. That is worse than not animating.
 */

interface AnimatedCounterProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  /** Seconds. Matches the previous GSAP default. */
  duration?: number;
}

/** GSAP's `power2.out`. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  label,
  duration = 2,
  className,
  ...props
}: AnimatedCounterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Starts at the real value so the server-rendered HTML is correct.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Honour a stated preference for less motion. A counter spinning is
    // exactly the kind of decorative animation the setting exists for.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || cancelled) return;
        // Once only. Re-running on every scroll past would be a distraction
        // rather than a flourish.
        observer.disconnect();
        cancelled = true;

        const started = performance.now();
        setDisplay(0);

        const step = (now: number) => {
          const progress = Math.min((now - started) / (duration * 1000), 1);
          setDisplay(Math.round(value * easeOutCubic(progress)));
          if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      // Matches GSAP's "top 85%": start when the element is 15% up the viewport.
      { rootMargin: "0px 0px -15% 0px" },
    );

    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="mb-2 flex items-baseline gap-1">
        {prefix && (
          <span className="text-2xl font-bold text-[var(--color-soyl-charcoal)]">{prefix}</span>
        )}
        <span className="text-4xl font-bold tracking-tight text-[var(--color-soyl-charcoal)] md:text-5xl">
          {display.toLocaleString()}
        </span>
        {suffix && (
          <span className="text-2xl font-bold text-[var(--color-soyl-charcoal)]">{suffix}</span>
        )}
      </div>
      <p className="text-center text-sm font-medium text-[var(--color-soyl-gray-600)]">{label}</p>
    </div>
  );
}
