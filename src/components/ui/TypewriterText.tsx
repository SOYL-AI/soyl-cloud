"use client";

import { motion, useInView, Variants } from "framer-motion";
import { useRef } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  wordClassName?: string;
}

export function TypewriterText({ text, className = "", wordClassName = "" }: TypewriterTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  
  const words = text.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      filter: "blur(8px)",
      y: 10,
    },
  };

  return (
    <motion.div
      ref={ref}
      className={`flex flex-wrap justify-center ${className}`}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          key={index}
          className={`mr-[0.3em] mb-1 inline-block ${wordClassName}`}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
