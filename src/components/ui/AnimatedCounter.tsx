"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedCounterProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
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
  const countRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!countRef.current || !containerRef.current || hasAnimated.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 85%",
        onEnter: () => {
          if (!hasAnimated.current) {
            hasAnimated.current = true;
            const proxy = { val: 0 };
            gsap.to(proxy, {
              val: value,
              duration,
              ease: "power2.out",
              onUpdate: () => {
                if (countRef.current) {
                  countRef.current.innerHTML = Math.round(proxy.val).toLocaleString();
                }
              },
            });
          }
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [value, duration]);

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm", className)}
      {...props}
    >
      <div className="flex items-baseline gap-1 mb-2">
        {prefix && <span className="text-2xl font-bold text-[var(--color-soyl-charcoal)]">{prefix}</span>}
        <span ref={countRef} className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-soyl-charcoal)]">
          0
        </span>
        {suffix && <span className="text-2xl font-bold text-[var(--color-soyl-charcoal)]">{suffix}</span>}
      </div>
      <p className="text-sm font-medium text-[var(--color-soyl-gray-600)] text-center">{label}</p>
    </div>
  );
}
