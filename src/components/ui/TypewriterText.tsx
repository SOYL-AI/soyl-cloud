"use client";

import { useEffect, useMemo, useState } from "react";

interface TypewriterTextProps {
  text?: string;
  phrases?: readonly string[];
  className?: string;
  wordClassName?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
}

/**
 * A small rotating typewriter that does not pull an animation library into the
 * page. The complete copy remains available to screen readers while the visual
 * version animates. Reduced-motion visitors get the first phrase, unchanged.
 */
export function TypewriterText({
  text,
  phrases,
  className = "",
  wordClassName = "",
  typeSpeed = 52,
  deleteSpeed = 28,
  pauseMs = 1900,
}: TypewriterTextProps) {
  const phraseKey = useMemo(
    () => (phrases?.length ? phrases : text ? [text] : [""]).join("\u0000"),
    [phrases, text],
  );
  const values = useMemo(() => phraseKey.split("\u0000"), [phraseKey]);
  const [visibleText, setVisibleText] = useState(values[0] ?? "");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || values.length < 2) {
      return;
    }

    let phraseIndex = 0;
    let characterIndex = values[0]?.length ?? 0;
    let deleting = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const phrase = values[phraseIndex] ?? "";

      if (deleting) {
        characterIndex -= 1;
        setVisibleText(phrase.slice(0, Math.max(0, characterIndex)));

        if (characterIndex <= 0) {
          phraseIndex = (phraseIndex + 1) % values.length;
          deleting = false;
          timeoutId = setTimeout(tick, 260);
          return;
        }

        timeoutId = setTimeout(tick, deleteSpeed);
        return;
      }

      const nextPhrase = values[phraseIndex] ?? "";
      characterIndex += 1;
      setVisibleText(nextPhrase.slice(0, characterIndex));

      if (characterIndex >= nextPhrase.length) {
        deleting = true;
        timeoutId = setTimeout(tick, pauseMs);
        return;
      }

      timeoutId = setTimeout(tick, typeSpeed);
    };

    timeoutId = setTimeout(tick, pauseMs);
    return () => clearTimeout(timeoutId);
  }, [deleteSpeed, pauseMs, typeSpeed, values]);

  return (
    <span className={`inline-block ${className}`}>
      <span className="sr-only">{values.join(" ")}</span>
      <span aria-hidden="true" className={wordClassName}>
        {visibleText}
        <span className="ml-1 inline-block h-[0.86em] w-[3px] animate-pulse bg-current align-[-0.04em] motion-reduce:hidden" />
      </span>
    </span>
  );
}
