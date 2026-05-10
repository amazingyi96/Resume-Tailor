"use client";

import { motion } from "framer-motion";

interface ATSScoreGaugeProps {
  score: number;
}

export function ATSScoreGauge({ score }: ATSScoreGaugeProps) {
  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
        ? "text-amber-500"
        : "text-red-500";

  const bgColor =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={color}
            strokeDasharray={`${2 * Math.PI * 42}`}
            initial={{
              strokeDashoffset: 2 * Math.PI * 42,
            }}
            animate={{
              strokeDashoffset:
                2 * Math.PI * 42 * (1 - score / 100),
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <motion.span
          className={`absolute font-bold text-2xl ${color}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {score}
        </motion.span>
      </div>
      <div className="mt-2 text-center">
        <p className="font-semibold text-sm">ATS Match Score</p>
        <p className="text-muted-foreground text-xs">
          {score >= 80
            ? "Strong match"
            : score >= 60
              ? "Moderate match"
              : "Needs improvement"}
        </p>
      </div>
    </div>
  );
}
