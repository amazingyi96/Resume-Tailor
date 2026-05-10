"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/glass-card";
import { ATSScoreGauge } from "./ats-score-gauge";
import { KeywordCoverage } from "./keyword-coverage";
import { MissingSkillsList } from "./missing-skills-list";
import { SuggestionsPanel } from "./suggestions-panel";
import type { AnalysisResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface AnalysisDashboardProps {
  analysis: AnalysisResult;
}

export function AnalysisDashboard({ analysis }: AnalysisDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <div className="p-5">
            <ATSScoreGauge score={analysis.atsScore} />
          </div>
        </GlassCard>
        <GlassCard>
          <div className="p-5">
            <KeywordCoverage
              coverage={analysis.keywordCoverage}
              matchedCount={analysis.matchedKeywords.length}
              totalCount={
                analysis.matchedKeywords.length +
                analysis.missingKeywords.length
              }
            />
            <div className="mt-4 space-y-3">
              <div>
                <h3 className="mb-1.5 font-medium text-sm">Matched Keywords</h3>
                <div className="flex flex-wrap gap-1">
                  {analysis.matchedKeywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="default"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs hover:bg-emerald-500/20"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="p-5">
          <MissingSkillsList skills={analysis.missingKeywords} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="p-5">
          <SuggestionsPanel suggestions={analysis.suggestions} />
        </div>
      </GlassCard>
    </motion.div>
  );
}
