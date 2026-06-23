"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface BrowserMockupProps {
  src?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function BrowserMockup({ src, alt, className = "", children }: BrowserMockupProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl overflow-hidden border border-gray-200/60 shadow-2xl bg-white flex flex-col ${className}`}
    >
      {/* Browser Chrome */}
      <div className="h-10 bg-[#F6F6F6] border-b border-gray-200/60 flex items-center px-4 shrink-0">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
          <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
        </div>
      </div>
      {/* Image or Component Container */}
      <div className="relative w-full aspect-[16/10] bg-gray-50 flex items-stretch">
        {src ? (
          <Image 
            src={src} 
            alt={alt || "Mockup"} 
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}
