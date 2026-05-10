import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, highlight, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border/40 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-lg",
        "transition-all duration-300 hover:border-primary/20 hover:shadow-xl",
        "dark:from-card/60 dark:to-card/30 dark:border-border/30",
        highlight && "ring-2 ring-primary/20 border-primary/40",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
