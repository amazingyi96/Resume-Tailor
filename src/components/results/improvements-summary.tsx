"use client";

import { motion } from "framer-motion";
import { Sparkles, PlusCircle, FileEdit, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ImprovementSummary } from "@/lib/types";

interface ImprovementsSummaryProps {
  improvements: ImprovementSummary;
}

export function ImprovementsSummary({ improvements }: ImprovementsSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid gap-4 sm:grid-cols-3"
    >
      <div className="rounded-xl border border-border/40 bg-card/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <PlusCircle className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">AI-Added Keywords</h4>
        </div>
        <div className="flex flex-wrap gap-1">
          {improvements.addedKeywords.map((kw) => (
            <Badge key={kw} variant="secondary" className="text-xs">
              {kw}
            </Badge>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border/40 bg-card/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <FileEdit className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">Sections Improved</h4>
        </div>
        <ul className="space-y-1">
          {improvements.changedSections.map((section) => (
            <li
              key={section}
              className="flex items-center gap-1.5 text-muted-foreground text-xs"
            >
              <Sparkles className="h-2.5 w-2.5 text-primary" />
              {section}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-border/40 bg-card/40 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h4 className="font-medium text-sm">Recruiter Notes</h4>
        </div>
        <ul className="space-y-1">
          {improvements.recruiterNotes.map((note, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-muted-foreground text-xs"
            >
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
