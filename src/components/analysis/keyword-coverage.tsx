"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface KeywordCoverageProps {
  coverage: number;
  matchedCount: number;
  totalCount: number;
}

export function KeywordCoverage({
  coverage,
  matchedCount,
  totalCount,
}: KeywordCoverageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Keyword Coverage</h3>
        <span className="font-semibold text-sm tabular-nums">
          {matchedCount}/{totalCount}
        </span>
      </div>
      <Progress value={coverage} className="h-2.5" />
      <p className="text-muted-foreground text-xs">
        {coverage}% of keywords from the job description are present in your
        resume.
      </p>
    </motion.div>
  );
}
