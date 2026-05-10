"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Gauge } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { ExportBar } from "@/components/results/export-bar";
import { ImprovementsSummary } from "@/components/results/improvements-summary";
import { ATSScoreGauge } from "@/components/analysis/ats-score-gauge";
import { ComparisonView } from "@/components/results/comparison-view";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Button } from "@/components/ui/button";
import { useVersionHistory } from "@/hooks/use-version-history";
import { useMediaQuery } from "@/hooks/use-media-query";
import { computeLineDiff } from "@/lib/diff";
import { TONE_OPTIONS } from "@/lib/constants";

export default function VersionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getVersion, deleteVersion } = useVersionHistory();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const id = params?.id as string;
  const version = getVersion(id);

  if (!version) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="mb-4 font-bold text-2xl">Version not found</h1>
        <p className="mb-6 text-muted-foreground">
          This version may have been deleted or never existed.
        </p>
        <Button onClick={() => router.push("/history")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to History
        </Button>
      </div>
    );
  }

  const { originalSegments, tailoredSegments } = computeLineDiff(
    version.originalResume,
    version.tailoredResume
  );

  const toneLabel =
    TONE_OPTIONS.find((t) => t.value === version.tone)?.label ??
    version.tone;

  const date = new Date(version.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const handleDelete = () => {
    deleteVersion(version.id);
    router.push("/history");
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={() => router.push("/history")}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-bold text-2xl">{version.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" />
                  ATS Score: {version.analysis.atsScore}/100
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary text-xs font-medium">
                  {toneLabel}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExportBar
                resumeText={version.tailoredResume}
                title={version.title}
              />
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ATS Score */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="p-5">
              <ATSScoreGauge score={version.analysis.atsScore} />
            </div>
          </GlassCard>
        </motion.div>

        {/* Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="p-5">
              <h2 className="mb-4 font-semibold text-lg">
                Side-by-Side Comparison
              </h2>
              <ComparisonView
                originalSegments={originalSegments}
                tailoredSegments={tailoredSegments}
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Improvements */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <div className="p-5">
              <h2 className="mb-4 font-semibold text-lg">
                AI Improvements
              </h2>
              <ImprovementsSummary improvements={version.improvements} />
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
}
