"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll-reveal, without an animation library.
 *
 * Two things this solves, in order of how much they cost.
 *
 * **1. Pages do not have to be client components.** `BASELINE.md` traced 76 KB
 * of unused JavaScript on the home page to `"use client"` on nearly every
 * `page.tsx`, almost always for animation alone. The trick that fixes it is
 * worth stating because it looks like it should not work: **children passed
 * from a server component to a client component stay server-rendered.** They
 * are serialised into the RSC payload and never enter the client bundle. So a
 * page stays RSC, wraps a section in `<Reveal>`, and ships this file's logic
 * rather than the section's markup and every icon and string inside it.
 *
 * **2. It does not pull in framer-motion.** This was built on framer-motion
 * first, which meant every marketing page loaded ~50 KB to fade some divs in.
 * `IntersectionObserver` and a CSS transition do the same job in a few lines,
 * and CSS transitions run off the main thread — which matters, because TBT was
 * what was holding performance below 90 rather than transfer size.
 *
 * `prefers-reduced-motion` is honoured in `globals.css` rather than here, so it
 * applies even before this component hydrates.
 */

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds. For staggering siblings that are not in a `RevealGroup`. */
  delay?: number;
  /**
   * The element to render. Defaults to a div.
   *
   * Wrapping `<li>` in a div-rendering component puts a div directly inside
   * `<ul>` — invalid HTML, and an accessibility failure, because a list that
   * does not contain only list items is announced wrongly. Caught by the audit
   * immediately after this component was first introduced.
   */
  as?: ElementType;
};

/**
 * Shared observer wiring.
 *
 * One observer per element rather than a shared one: the elements are few, the
 * observers disconnect as soon as they fire, and a registry keyed by element
 * would be more machinery than the saving is worth.
 */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Immediate check if element is already in or near viewport
    const rect = node.getBoundingClientRect();
    if (rect.top < (window.innerHeight || 800) + 100) {
      node.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        node.dataset.revealed = "true";
        observer.disconnect();
      },
      { rootMargin: "100px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Element = "div",
}: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  // Automatically convert milliseconds (e.g. 100ms) to seconds (0.1s)
  const delayInSeconds = delay > 10 ? delay / 1000 : delay;

  return (
    <Element
      ref={ref}
      className={cn("soyl-reveal", className)}
      style={delayInSeconds ? { transitionDelay: `${delayInSeconds}s` } : undefined}
    >
      {children}
    </Element>
  );
}

/**
 * Reveals its children in sequence rather than together.
 *
 * Only worth using where the children read as a list — a row of cards, a set of
 * features. Applied to unrelated blocks it just makes the page feel slow.
 */
export function RevealGroup({
  children,
  className,
  as: Element = "div",
}: Omit<RevealProps, "delay">) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <Element ref={ref} className={cn("soyl-reveal-group", className)}>
      {children}
    </Element>
  );
}

/**
 * The above-the-fold variant: animates on load rather than on scroll.
 *
 * There is no scroll event to wait for above the fold, and `whileInView` there
 * produces a flash of hidden content while the observer settles.
 *
 * **Never wrap the LCP element in this.** An opacity transition on the largest
 * element delays LCP by exactly the transition's duration, because the metric
 * measures when the element reaches its final painted state. The hero heading
 * is deliberately not animated for that reason.
 */
export function RevealOnLoad({
  children,
  className,
  delay = 0,
  as: Element = "div",
}: RevealProps) {
  return (
    <Element
      className={cn("soyl-reveal-load", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Element>
  );
}
