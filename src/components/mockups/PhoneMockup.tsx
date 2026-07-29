"use client";

import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
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
    <Reveal className={cn("relative flex justify-center w-full", float && "soyl-float")}>
      {content}
    </Reveal>
  );
}
