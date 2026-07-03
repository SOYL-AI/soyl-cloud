import * as React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
}

export function Container({ className, size = "lg", children, ...props }: ContainerProps) {
  const sizes = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[1400px]",
  };

  return (
    <div
      className={cn("mx-auto w-full px-6 lg:px-12", sizes[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}
