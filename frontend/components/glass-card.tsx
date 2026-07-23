"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-glass-bg border border-glass-border backdrop-blur-[24px] rounded-2xl shadow-glass",
        hover && "hover:bg-glass-hover hover:shadow-glass-hover transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}
