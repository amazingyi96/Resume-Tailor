"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { StepMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LoadingWorkflowProps {
  steps: StepMessage[];
  isVisible: boolean;
}

export function LoadingWorkflow({ steps, isVisible }: LoadingWorkflowProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mx-auto mb-8 max-w-lg"
        >
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Loader2 className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="font-medium text-sm">
                Tailoring your resume&hellip;
              </span>
            </div>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  {step.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : step.status === "active" ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Loader2 className="h-4 w-4 text-primary shrink-0 animate-spin" />
                    </motion.div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      step.status === "done" && "text-muted-foreground",
                      step.status === "active" && "text-foreground font-medium",
                      step.status === "pending" && "text-muted-foreground/60"
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
