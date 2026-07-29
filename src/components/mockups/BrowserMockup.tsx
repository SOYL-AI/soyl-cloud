"use client";

import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

interface BrowserMockupProps {
  src?: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
  glow?: boolean;
  float?: boolean;
  /**
   * Set on the hero image only.
   *
   * Without it `next/image` lazy-loads, so the browser does not begin fetching
   * the largest element on the page until layout has settled — which is the
   * definition of a late LCP. With it, the image is preloaded in the document
   * head and the fetch starts with the HTML.
   *
   * Deliberately opt-in: `priority` on every mockup would preload four large
   * images and make the hero compete with three below-fold ones for bandwidth,
   * which is worse than lazy-loading all of them.
   */
  priority?: boolean;
}

export function BrowserMockup({ 
  src, 
  alt, 
  className, 
  children,
  glow = false,
  float = false,
  priority = false,
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
            quality={80}
            priority={priority}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );

  return (
    <Reveal className={cn("relative w-full", float && "soyl-float")}>
      {glow && (
        <div className="absolute inset-0 -m-4 bg-[var(--color-soyl-mint)] opacity-15 blur-3xl rounded-full z-0 pointer-events-none mix-blend-multiply" />
      )}
      {content}
    </Reveal>
  );
}
