"use client";

import { motion } from "framer-motion";
import { DiffPanel } from "./diff-panel";
import type { DiffResult } from "@/lib/diff";

interface ComparisonViewProps {
  originalSegments: DiffResult[];
  tailoredSegments: DiffResult[];
}

export function ComparisonView({
  originalSegments,
  tailoredSegments,
}: ComparisonViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <DiffPanel
          segments={originalSegments}
          label="Original Resume"
          variant="original"
        />
        <DiffPanel
          segments={tailoredSegments}
          label="Tailored Resume"
          variant="tailored"
        />
      </div>
    </motion.div>
  );
}
