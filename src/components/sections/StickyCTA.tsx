"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/Button";

interface StickyCTAProps {
  title?: string;
}

export function StickyCTA({ title = "SOYL Cloud — AI Concierge for Hotels" }: StickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past hero section (approx 600px)
      if (window.scrollY > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm py-3 px-6 hidden md:block"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--color-soyl-charcoal)]">
              {title}
            </span>
            <div className="flex items-center gap-4">
              <Button size="sm" variant="outline" href="/pricing" className="hidden lg:inline-flex">
                View Pricing
              </Button>
              <Button size="sm" variant="primary" href="/book-demo">
                Book a Demo →
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
