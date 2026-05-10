"use client";

import { useState, useCallback, useRef } from "react";
import type {
  TailorState,
  ToneStyle,
  AnalysisResult,
  ImprovementSummary,
  TailorResponse,
} from "@/lib/types";
import { WORKFLOW_STEPS } from "@/lib/constants";
import { computeLineDiff } from "@/lib/diff";
import { useVersionHistory } from "./use-version-history";
import { saveLastSession } from "@/lib/storage";

const initialState: TailorState = {
  jobDescription: "",
  resume: "",
  selectedTone: "corporate-professional",
  workflowPhase: "idle",
  activeSteps: WORKFLOW_STEPS.map((s) => ({ ...s })),
  analysis: null,
  tailoredResume: null,
  diffSegments: null,
  originalSegments: null,
  improvements: null,
  error: null,
};

export function useTailor() {
  const [state, setState] = useState<TailorState>(initialState);
  const { saveVersion: persistVersion } = useVersionHistory();
  const abortRef = useRef<AbortController | null>(null);

  const setJobDescription = useCallback((jd: string) => {
    setState((prev) => ({ ...prev, jobDescription: jd, error: null }));
  }, []);

  const setResume = useCallback((resume: string) => {
    setState((prev) => ({ ...prev, resume, error: null }));
  }, []);

  const setSelectedTone = useCallback((tone: ToneStyle) => {
    setState((prev) => ({ ...prev, selectedTone: tone }));
  }, []);

  const updateStep = useCallback(
    (stepId: string, status: "pending" | "active" | "done") => {
      setState((prev) => ({
        ...prev,
        activeSteps: prev.activeSteps.map((s) =>
          s.id === stepId ? { ...s, status } : s
        ),
      }));
    },
    []
  );

  const runAnalysis = useCallback(async () => {
    if (!state.jobDescription.trim() || !state.resume.trim()) return;

    abortRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      workflowPhase: "analyzing",
      error: null,
      activeSteps: WORKFLOW_STEPS.map((s) => ({
        ...s,
        status: s.id === "parse" ? "active" : "pending",
      })),
    }));

    try {
      updateStep("parse", "done");
      updateStep("analyze", "active");

      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          jobDescription: state.jobDescription,
          resume: state.resume,
        }),
        signal: abortRef.current.signal,
      });

      updateStep("analyze", "done");
      updateStep("score", "active");

      const json: TailorResponse = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      const analysis = (json as { data: AnalysisResult }).data as AnalysisResult;

      updateStep("score", "done");

      saveLastSession(state.jobDescription, state.resume);

      setState((prev) => ({
        ...prev,
        workflowPhase: "done",
        analysis,
        activeSteps: WORKFLOW_STEPS.map((s) => ({
          ...s,
          status: s.id === "tailor" || s.id === "verify" ? "pending" : "done",
        })),
      }));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        workflowPhase: "error",
        error: err instanceof Error ? err.message : "Analysis failed",
      }));
    }
  }, [state.jobDescription, state.resume, updateStep]);

  const runTailor = useCallback(async () => {
    if (!state.jobDescription.trim() || !state.resume.trim() || !state.analysis) return;

    abortRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      workflowPhase: "tailoring",
      error: null,
      activeSteps: prev.activeSteps.map((s) =>
        s.id === "tailor"
          ? { ...s, status: "active" }
          : s.id === "verify"
            ? { ...s, status: "pending" }
            : s
      ),
    }));

    try {
      updateStep("tailor", "active");

      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tailor",
          jobDescription: state.jobDescription,
          resume: state.resume,
          tone: state.selectedTone,
          analysis: state.analysis,
        }),
        signal: abortRef.current.signal,
      });

      updateStep("tailor", "done");
      updateStep("verify", "active");

      const json: TailorResponse = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      const { tailoredResume, improvements } = (
        json as { data: { tailoredResume: string; improvements: ImprovementSummary } }
      ).data;

      updateStep("verify", "done");

      const lineDiff = computeLineDiff(
        state.resume,
        tailoredResume
      );

      saveLastSession(state.jobDescription, state.resume);

      setState((prev) => ({
        ...prev,
        workflowPhase: "done",
        tailoredResume,
        improvements,
        diffSegments: lineDiff.tailoredSegments,
        originalSegments: lineDiff.originalSegments,
        activeSteps: WORKFLOW_STEPS.map((s) => ({
          ...s,
          status: "done",
        })),
      }));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        workflowPhase: "error",
        error: err instanceof Error ? err.message : "Tailoring failed",
      }));
    }
  }, [
    state.jobDescription,
    state.resume,
    state.selectedTone,
    state.analysis,
    updateStep,
  ]);

  const handleSaveVersion = useCallback(() => {
    if (
      !state.tailoredResume ||
      !state.analysis ||
      !state.improvements
    )
      return;

    const title =
      state.analysis.jdSummary.roleTitle ||
      "Tailored Resume";

    persistVersion({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title: `${title} — ${new Date().toLocaleDateString()}`,
      jobDescription: state.jobDescription,
      originalResume: state.resume,
      tailoredResume: state.tailoredResume,
      analysis: state.analysis,
      tone: state.selectedTone,
      improvements: state.improvements,
    });
  }, [
    state.tailoredResume,
    state.analysis,
    state.improvements,
    state.jobDescription,
    state.resume,
    state.selectedTone,
    persistVersion,
  ]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState);
  }, []);

  const runAnalyzeAndTailor = useCallback(async () => {
    if (!state.jobDescription.trim() || !state.resume.trim()) return;

    abortRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      workflowPhase: "analyzing",
      error: null,
      activeSteps: WORKFLOW_STEPS.map((s) => ({
        ...s,
        status: s.id === "parse" ? "active" : "pending",
      })),
    }));

    try {
      updateStep("parse", "done");
      updateStep("analyze", "active");

      const analyzeRes = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          jobDescription: state.jobDescription,
          resume: state.resume,
        }),
        signal: abortRef.current.signal,
      });

      updateStep("analyze", "done");
      updateStep("score", "active");

      const analyzeJson: TailorResponse = await analyzeRes.json();
      if (!analyzeJson.success) throw new Error(analyzeJson.error);

      const analysis = (analyzeJson as { data: AnalysisResult }).data as AnalysisResult;

      updateStep("score", "done");
      updateStep("tailor", "active");

      const tailorRes = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tailor",
          jobDescription: state.jobDescription,
          resume: state.resume,
          tone: state.selectedTone,
          analysis,
        }),
        signal: abortRef.current.signal,
      });

      updateStep("tailor", "done");
      updateStep("verify", "active");

      const tailorJson: TailorResponse = await tailorRes.json();
      if (!tailorJson.success) throw new Error(tailorJson.error);

      const { tailoredResume, improvements } = (
        tailorJson as { data: { tailoredResume: string; improvements: ImprovementSummary } }
      ).data;

      updateStep("verify", "done");

      const lineDiff = computeLineDiff(state.resume, tailoredResume);

      saveLastSession(state.jobDescription, state.resume);

      setState((prev) => ({
        ...prev,
        workflowPhase: "done",
        analysis,
        tailoredResume,
        improvements,
        diffSegments: lineDiff.tailoredSegments,
        originalSegments: lineDiff.originalSegments,
        activeSteps: WORKFLOW_STEPS.map((s) => ({ ...s, status: "done" })),
      }));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        workflowPhase: "error",
        error: err instanceof Error ? err.message : "Operation failed",
      }));
    }
  }, [
    state.jobDescription,
    state.resume,
    state.selectedTone,
    updateStep,
  ]);

  const canAnalyze =
    state.jobDescription.trim().length > 20 &&
    state.resume.trim().length > 20;

  const canTailor =
    state.analysis !== null &&
    state.workflowPhase === "done";

  const hasResults =
    state.tailoredResume !== null;

  return {
    state,
    setJobDescription,
    setResume,
    setSelectedTone,
    runAnalysis,
    runTailor,
    runAnalyzeAndTailor,
    saveVersion: handleSaveVersion,
    reset,
    canAnalyze,
    canTailor,
    hasResults,
  };
}
