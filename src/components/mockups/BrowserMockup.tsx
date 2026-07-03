"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BrowserMockupProps {
  src?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
  glow?: boolean;
  float?: boolean;
}

export function BrowserMockup({ 
  src, 
  alt, 
  className, 
  children,
  glow = false,
  float = false
}: BrowserMockupProps) {
  const content = (
    <div className={cn(
      "rounded-xl md:rounded-2xl overflow-hidden border border-[var(--color-soyl-gray-200)] shadow-2xl bg-white flex flex-col relative z-10",
      className
    )}>
      {/* Browser Chrome */}
      <div className="h-8 md:h-10 bg-[#F6F6F6] border-b border-[var(--color-soyl-gray-200)] flex items-center px-4 shrink-0">
        <div className="flex gap-1.5 md:gap-2">
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
        </div>
      </div>
      {/* Content */}
      <div className="relative w-full aspect-[16/10] bg-[var(--color-soyl-gray-50)] flex items-stretch">
        {src ? (
          <Image 
            src={src} 
            alt={alt || "Browser Mockup"} 
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 80vw"
            quality={90}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full"
      whileHover={float ? { y: -5, transition: { duration: 0.3 } } : undefined}
    >
      {glow && (
        <div className="absolute inset-0 -m-4 bg-[var(--color-soyl-mint)] opacity-15 blur-3xl rounded-full z-0 pointer-events-none mix-blend-multiply" />
      )}
      {content}
    </motion.div>
  );
}
