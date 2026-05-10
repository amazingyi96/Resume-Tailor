export type ToneStyle =
  | "corporate-professional"
  | "modern-startup"
  | "executive"
  | "concise-ats"
  | "results-driven";

export type WorkflowPhase =
  | "idle"
  | "analyzing"
  | "tailoring"
  | "diffing"
  | "done"
  | "error";

export interface StepMessage {
  id: string;
  label: string;
  status: "pending" | "active" | "done";
}

export interface AnalysisResult {
  atsScore: number;
  keywordCoverage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  jdSummary: {
    requiredSkills: string[];
    preferredSkills: string[];
    softSkills: string[];
    atsKeywords: string[];
    roleTitle: string;
    companyName?: string;
  };
}

export interface ImprovementSummary {
  addedKeywords: string[];
  changedSections: string[];
  recruiterNotes: string[];
}

export interface DiffSegment {
  text: string;
  type: "added" | "removed" | "unchanged";
}

export interface TailorState {
  jobDescription: string;
  resume: string;
  selectedTone: ToneStyle;
  workflowPhase: WorkflowPhase;
  activeSteps: StepMessage[];
  analysis: AnalysisResult | null;
  tailoredResume: string | null;
  diffSegments: DiffSegment[] | null;
  originalSegments: DiffSegment[] | null;
  improvements: ImprovementSummary | null;
  error: string | null;
}

export interface Version {
  id: string;
  createdAt: string;
  title: string;
  jobDescription: string;
  originalResume: string;
  tailoredResume: string;
  analysis: AnalysisResult;
  tone: ToneStyle;
  improvements: ImprovementSummary;
}

export interface StorageSchema {
  version: 1;
  versions: Version[];
}

export interface TailorRequest {
  action: "analyze" | "tailor" | "fetch-url";
  jobDescription?: string;
  resume?: string;
  tone?: ToneStyle;
  analysis?: AnalysisResult;
  url?: string;
}

export interface TailorSuccessResponse {
  success: true;
  action: "analyze" | "tailor";
  data: AnalysisResult | { tailoredResume: string; improvements: ImprovementSummary };
}

export interface TailorErrorResponse {
  success: false;
  error: string;
  code: "VALIDATION_ERROR" | "CLAUDE_ERROR" | "PARSE_ERROR" | "HALLUCINATION_DETECTED" | "RATE_LIMIT";
}

export type TailorResponse = TailorSuccessResponse | TailorErrorResponse;
