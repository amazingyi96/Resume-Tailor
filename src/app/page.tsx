"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/shared/glass-card";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { JobDescriptionInput } from "@/components/editor/job-description-input";
import { ResumeInput } from "@/components/editor/resume-input";
import { ToneSelector } from "@/components/editor/tone-selector";
import { TailorButton } from "@/components/editor/tailor-button";
import { AnalysisDashboard } from "@/components/analysis/analysis-dashboard";
import { ComparisonView } from "@/components/results/comparison-view";
import { ImprovementsSummary } from "@/components/results/improvements-summary";
import { ExportBar } from "@/components/results/export-bar";
import { LoadingWorkflow } from "@/components/shared/loading-workflow";
import { EmptyState } from "@/components/shared/empty-state";
import { CoverLetterGenerator } from "@/components/cover-letter/cover-letter-generator";
import { useTailor } from "@/hooks/use-tailor";
import { Button } from "@/components/ui/button";
import { loadLastSession } from "@/lib/storage";
import { JobSearchPanel } from "@/components/editor/job-search-panel";
import {
  Save,
  RotateCcw,
  AlertCircle,
  FileText,
  Briefcase,
  Search,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const {
    state,
    setJobDescription,
    setResume,
    setSelectedTone,
    runAnalysis,
    runTailor,
    runAnalyzeAndTailor,
    saveVersion,
    reset,
    canAnalyze,
    canTailor,
    hasResults,
  } = useTailor();

  const isLoading =
    state.workflowPhase !== "idle" &&
    state.workflowPhase !== "done" &&
    state.workflowPhase !== "error";

  const [activeTab, setActiveTab] = useState("tailor");

  // Load last session
  useEffect(() => {
    const lastSession = loadLastSession();
    if (lastSession) {
      if (lastSession.jobDescription) setJobDescription(lastSession.jobDescription);
      if (lastSession.resume) setResume(lastSession.resume);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectJob = (description: string, title: string) => {
    setJobDescription(description);
    setActiveTab("tailor");
  };

  const showEmptyState =
    !state.analysis && !state.tailoredResume && state.workflowPhase === "idle";

  const hasInputs = state.jobDescription.trim().length > 0 || state.resume.trim().length > 0;

  return (
    <ErrorBoundary>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Tabs at the top */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="tailor" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Tailor Resume
            </TabsTrigger>
            <TabsTrigger value="cover-letter" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Cover Letter
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-1.5">
              <Briefcase className="h-4 w-4" />
              Find Jobs
            </TabsTrigger>
          </TabsList>

          {/* Shared Input Section */}
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <GlassCard>
              <div className="p-4">
                <JobDescriptionInput
                  value={state.jobDescription}
                  onChange={setJobDescription}
                  disabled={isLoading}
                />
              </div>
            </GlassCard>
            <GlassCard>
              <div className="space-y-3 p-4">
                <ResumeInput
                  value={state.resume}
                  onChange={setResume}
                  disabled={isLoading}
                />
                <ToneSelector
                  value={state.selectedTone}
                  onChange={setSelectedTone}
                  disabled={isLoading}
                />
              </div>
            </GlassCard>
          </div>

          {/* Tab 1: Tailor Resume */}
          <TabsContent value="tailor" className="mt-0">
            <div className="mb-6">
              <TailorButton
                onAnalyzeAndTailor={runAnalyzeAndTailor}
                onAnalyzeOnly={runAnalysis}
                onTailor={runTailor}
                disabled={isLoading}
                phase={state.workflowPhase}
                canAnalyze={canAnalyze}
                canTailor={canTailor}
              />
            </div>

            {/* Loading */}
            <LoadingWorkflow steps={state.activeSteps} isVisible={isLoading} />

            {/* Error */}
            <AnimatePresence>
              {state.workflowPhase === "error" && state.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 mx-auto max-w-lg"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-950/20">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-red-700 dark:text-red-400">
                        Something went wrong
                      </p>
                      <p className="text-red-600 dark:text-red-300">{state.error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={reset}>
                      Reset
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {showEmptyState && <EmptyState type="welcome" />}

            {/* Results */}
            <AnimatePresence>
              {(state.analysis || state.tailoredResume) && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold text-lg">Results</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {hasResults && (
                        <>
                          <ExportBar
                            resumeText={state.tailoredResume!}
                            title={state.analysis?.jdSummary.roleTitle ?? "Tailored Resume"}
                          />
                          <Button variant="outline" size="sm" onClick={saveVersion}>
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            Save Version
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={reset}>
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Start Over
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="analysis">
                    <TabsList>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                      <TabsTrigger value="comparison" disabled={!hasResults}>
                        Comparison
                      </TabsTrigger>
                      <TabsTrigger value="improvements" disabled={!hasResults}>
                        Improvements
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="analysis" className="mt-4">
                      {state.analysis && <AnalysisDashboard analysis={state.analysis} />}
                    </TabsContent>
                    <TabsContent value="comparison" className="mt-4">
                      {hasResults && state.diffSegments && state.originalSegments && (
                        <ComparisonView
                          originalSegments={state.originalSegments}
                          tailoredSegments={state.diffSegments}
                        />
                      )}
                    </TabsContent>
                    <TabsContent value="improvements" className="mt-4">
                      {state.improvements && <ImprovementsSummary improvements={state.improvements} />}
                    </TabsContent>
                  </Tabs>
                </motion.section>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Tab 2: Cover Letter */}
          <TabsContent value="cover-letter" className="mt-0">
            <CoverLetterGenerator
              jobDescription={state.jobDescription}
              resume={state.resume}
              disabled={isLoading}
            />
          </TabsContent>

          {/* Tab 3: Find Jobs */}
          <TabsContent value="jobs" className="mt-0">
            <div className="space-y-6">
              <GlassCard>
                <div className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Find Job Listings</h2>
                  </div>
                  <JobSearchPanel onSelectJob={handleSelectJob} />
                </div>
              </GlassCard>
            </div>
          </TabsContent>
      </Tabs>
      </div>
    </ErrorBoundary>
  );
}
