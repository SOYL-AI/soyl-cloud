"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  src?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
  float?: boolean;
}

export function PhoneMockup({ 
  src, 
  alt, 
  className, 
  children,
  float = false
}: PhoneMockupProps) {
  const content = (
    <div className={cn(
      "relative w-[280px] md:w-[320px] aspect-[9/19.5] rounded-[40px] md:rounded-[48px] overflow-hidden border-[8px] md:border-[12px] border-[#1A1F25] shadow-2xl bg-white",
      className
    )}>
      {/* Phone Notch/Island */}
      <div className="absolute top-0 inset-x-0 h-7 md:h-8 flex justify-center z-20">
        <div className="w-[100px] md:w-[120px] h-[24px] md:h-[28px] bg-[#1A1F25] rounded-b-2xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative w-full h-full bg-[var(--color-soyl-gray-50)]">
        {src ? (
          <Image 
            src={src} 
            alt={alt || "Phone Mockup"} 
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 280px, 320px"
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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="relative flex justify-center w-full"
      whileHover={float ? { y: -8, transition: { duration: 0.4 } } : undefined}
    >
      {content}
    </motion.div>
  );
}
