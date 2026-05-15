import type { StepMessage, ToneStyle, ApplicationStatus, NoteType } from "./types";

export const TONE_OPTIONS: { value: ToneStyle; label: string; description: string }[] = [
  {
    value: "corporate-professional",
    label: "Corporate Professional",
    description: "Formal, polished, industry-standard terminology",
  },
  {
    value: "modern-startup",
    label: "Modern Startup",
    description: "Direct, action-oriented, emphasizes impact",
  },
  {
    value: "executive",
    label: "Executive",
    description: "Strategic, results-focused, boardroom language",
  },
  {
    value: "concise-ats",
    label: "Concise ATS-Friendly",
    description: "Maximum keyword density, bullet-optimized",
  },
  {
    value: "results-driven",
    label: "Results-Driven",
    description: "Quantified achievements, metrics-focused",
  },
];

export const MAX_JD_LENGTH = 15000;
export const MAX_RESUME_LENGTH = 20000;

export const STORAGE_KEY_VERSIONS = "resumetailor_versions";
export const STORAGE_KEY_LAST_SESSION = "resumetailor_last_session";

export const WORKFLOW_STEPS: StepMessage[] = [
  { id: "parse", label: "Parsing job description and extracting keywords", status: "pending" },
  { id: "analyze", label: "Analyzing resume against role requirements", status: "pending" },
  { id: "score", label: "Calculating ATS match score and coverage", status: "pending" },
  { id: "tailor", label: "Rewriting resume for optimal alignment", status: "pending" },
  { id: "verify", label: "Verifying authenticity and validating output", status: "pending" },
];

export const APP_NAME = "ResumeTailor";

// ── Job Application Tracker ──

export const STORAGE_KEY_APPLICATIONS = "resumetailor_applications";

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "phone_screen", label: "Phone Screen" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  general: "General",
  research: "Research",
  interview_prep: "Interview Prep",
  reflection: "Reflection",
  follow_up: "Follow-up",
};

export const INDUSTRY_OPTIONS = [
  "Agriculture & Farming",
  "Education & Training",
  "Government & Public Sector",
  "Healthcare & Medical",
  "Hospitality & Tourism",
  "Manufacturing & Logistics",
  "Mining & Resources",
  "Professional Services",
  "Real Estate & Property",
  "Retail & Consumer Goods",
  "Technology & IT",
  "Tourism & Events",
  "Other",
];

export const JOB_TYPE_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Casual",
  "Fixed-term",
  "Remote",
];
