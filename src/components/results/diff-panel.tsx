"use client";

import { cn } from "@/lib/utils";
import type { DiffResult } from "@/lib/diff";

interface DiffPanelProps {
  segments: DiffResult[];
  label: string;
  variant: "original" | "tailored";
}

export function DiffPanel({ segments, label, variant }: DiffPanelProps) {
  return (
    <div className="flex-1">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            variant === "original" ? "bg-red-500" : "bg-emerald-500"
          )}
        />
        <h3 className="font-medium text-sm">{label}</h3>
      </div>
      <div className="rounded-lg border border-border/50 bg-background/50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
        {segments.map((seg, i) => (
          <span
            key={i}
            className={cn(
              seg.type === "unchanged" && "",
              variant === "original" &&
                seg.type === "removed" &&
                "bg-red-500/15 text-red-600 dark:text-red-400 line-through rounded-sm",
              variant === "tailored" &&
                seg.type === "added" &&
                "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-sm"
            )}
          >
            {seg.text}
          </span>
        ))}
      </div>
    </div>
  );
}
