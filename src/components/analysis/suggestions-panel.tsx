"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface SuggestionsPanelProps {
  suggestions: string[];
}

export function SuggestionsPanel({ suggestions }: SuggestionsPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-sm">Improvement Suggestions</h3>
      </div>
      <ul className="space-y-2">
        {suggestions.map((suggestion, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="flex items-start gap-2 text-sm"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-muted-foreground">{suggestion}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
