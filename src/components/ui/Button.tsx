import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  href?: string;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      href,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-white";
    
    const variants = {
      primary: "bg-[var(--color-soyl-charcoal)] text-white hover:bg-black shadow-sm",
      secondary: "bg-[var(--color-soyl-mint)] text-[var(--color-soyl-charcoal)] hover:bg-[var(--color-soyl-mint-dark)] hover:text-white shadow-sm",
      outline: "border border-gray-200 bg-white text-[var(--color-soyl-charcoal)] hover:bg-gray-50 hover:text-gray-900 shadow-sm",
      ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
      link: "text-[var(--color-soyl-charcoal)] underline-offset-4 hover:underline",
    };

    const sizes = {
      sm: "h-9 px-3",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-base rounded-full",
      icon: "h-10 w-10",
    };

    const classes = cn(baseStyles, variants[variant], sizes[size], className);

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
