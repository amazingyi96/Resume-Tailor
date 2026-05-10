"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type { WorkflowPhase } from "@/lib/types";

interface TailorButtonProps {
  onAnalyzeAndTailor: () => void;
  onAnalyzeOnly: () => void;
  onTailor: () => void;
  disabled: boolean;
  phase: WorkflowPhase;
  canAnalyze: boolean;
  canTailor: boolean;
}

export function TailorButton({
  onAnalyzeAndTailor,
  onAnalyzeOnly,
  onTailor,
  disabled,
  phase,
  canAnalyze,
  canTailor,
}: TailorButtonProps) {
  const isLoading = phase !== "idle" && phase !== "done" && phase !== "error";

  if (!canAnalyze && !canTailor) {
    return (
      <Button disabled size="lg" className="w-full gap-2">
        <Sparkles className="h-4 w-4" />
        Paste JD & Resume to start
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={canTailor ? onTailor : onAnalyzeAndTailor}
        disabled={disabled || isLoading}
        size="lg"
        className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {phase === "analyzing"
              ? "Analyzing & Tailoring..."
              : phase === "tailoring"
                ? "Tailoring..."
                : "Processing..."}
          </>
        ) : canTailor ? (
          <>
            <Sparkles className="h-4 w-4" />
            Tailor Resume
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze & Tailor
          </>
        )}
      </Button>
      {!canTailor && (
        <Button
          variant="outline"
          size="lg"
          onClick={onAnalyzeOnly}
          disabled={disabled || isLoading}
          className="shrink-0"
        >
          Analyze Only
        </Button>
      )}
    </div>
  );
}
