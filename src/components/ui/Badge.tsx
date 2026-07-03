import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  dot?: boolean;
}

export function Badge({ className, variant = "primary", dot = false, children, ...props }: BadgeProps) {
  const variants = {
    primary: "bg-[var(--color-soyl-charcoal)] text-white border-transparent",
    secondary: "bg-[var(--color-soyl-mint-light)] text-[var(--color-soyl-mint-dark)] border-[var(--color-soyl-mint)]",
    outline: "border-gray-200 text-[var(--color-soyl-charcoal)] bg-white",
    ghost: "border-transparent text-gray-500 bg-gray-50",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-40"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {children}
    </div>
  );
}
