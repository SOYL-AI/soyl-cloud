"use client";

import { motion, useInView, Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
}

export function TypewriterText({ text, className = "", wordClassName = "" }: TypewriterTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    let count = 0;
    const intervalId = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= text.length) {
        clearInterval(intervalId);
      }
    }, 25); // Faster typing speed, 25ms per char

    return () => clearInterval(intervalId);
  }, [isInView, text]);

  const words = text.split(" ");
  let globalCharIndex = 0;

  return (
    <div ref={ref} className={`inline-block ${className}`}>
      {words.map((word, wIndex) => {
        const isLastWord = wIndex === words.length - 1;
        return (
          <span key={wIndex} className="inline-block whitespace-nowrap">
            {word.split("").map((char, cIndex) => {
              const currentGlobalIndex = globalCharIndex++;
              return (
                <span
                  key={cIndex}
                  className={wordClassName}
                  style={{ visibility: currentGlobalIndex < visibleCount ? "visible" : "hidden" }}
                >
                  {char}
                </span>
              );
            })}
            {!isLastWord && (
              <span 
                style={{ visibility: globalCharIndex++ < visibleCount ? "visible" : "hidden", whiteSpace: "pre" }}
              >
                {" "}
              </span>
            )}
          </span>
        );
      })}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        className={`inline-block w-[4px] h-[0.9em] ml-1 bg-current align-middle ${wordClassName}`}
      />
    </div>
  );
}
