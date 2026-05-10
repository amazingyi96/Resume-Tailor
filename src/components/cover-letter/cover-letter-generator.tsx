"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExportBar } from "@/components/results/export-bar";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  FileText,
  ChevronDown,
  Download,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "actively-applying", label: "Actively applying & interviewing" },
  { value: "casually-exploring", label: "Casually exploring opportunities" },
  { value: "employed-open", label: "Currently employed but open to move" },
  { value: "relocating", label: "Planning to relocate to this area" },
  { value: "career-change", label: "Making a career transition" },
  { value: "returning", label: "Returning to workforce after a break" },
];

const START_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "immediately", label: "Immediately available" },
  { value: "2-weeks", label: "2 weeks notice" },
  { value: "4-weeks", label: "4 weeks notice" },
  { value: "negotiable", label: "Negotiable" },
];

interface CoverLetterGeneratorProps {
  jobDescription: string;
  resume: string;
  disabled: boolean;
}

export function CoverLetterGenerator({
  jobDescription,
  resume,
  disabled,
}: CoverLetterGeneratorProps) {
  const [companyName, setCompanyName] = useState("");
  const [whyThisRole, setWhyThisRole] = useState("");
  const [jobStatus, setJobStatus] = useState("");
  const [keyAchievement, setKeyAchievement] = useState("");
  const [availability, setAvailability] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canGenerate =
    jobDescription.trim().length > 50 && resume.trim().length > 50 && !loading;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resume,
          companyName: companyName || undefined,
          whyThisRole: whyThisRole || undefined,
          jobStatus: jobStatus || undefined,
          keyAchievement: keyAchievement || undefined,
          availability: availability || undefined,
          extraNotes: extraNotes || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setCoverLetter(json.data.coverLetter);
      setSubjectLine(json.data.subjectLine);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const today = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const letterBody = coverLetter
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cover Letter — ${companyName || "Application"}</title>
<style>
  body {
    font-family: Georgia, "Times New Roman", serif;
    max-width: 700px;
    margin: 60px auto;
    padding: 0 24px;
    color: #1a1a1a;
    line-height: 1.7;
    background: #fff;
  }
  .date { color: #666; font-size: 14px; margin-bottom: 24px; }
  .subject { font-weight: 600; margin-bottom: 20px; font-size: 15px; }
  p { margin: 0 0 16px 0; }
  .signature { margin-top: 32px; }
  @media print {
    body { margin: 40px auto; }
  }
</style>
</head>
<body>
  <div class="date">${today}</div>
  <div class="subject">${subjectLine}</div>
  <p>${letterBody}</p>
  <div class="signature"><p>Warm regards,</p></div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover Letter — ${companyName || "Application"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasInputs = jobDescription.trim().length > 50 && resume.trim().length > 50;

  return (
    <div className="space-y-6">
      {!hasInputs ? (
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">
              Paste a job description and your resume above to get started
            </p>
            <p className="text-muted-foreground/60 text-sm">
              Then fill in the questions below to generate a personalised cover
              letter
            </p>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Questionnaire */}
          <GlassCard>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Tell us about yourself</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                The more you share, the more authentic and compelling your cover
                letter will be.
              </p>

              <div>
                <label className="mb-1 block font-medium text-xs">
                  Company you&apos;re applying to
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Canva"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-xs">
                  Why do you want this specific role at this company? *
                </label>
                <Textarea
                  value={whyThisRole}
                  onChange={(e) => setWhyThisRole(e.target.value)}
                  placeholder="e.g. I've used Canva since 2018 and love how it democratises design. My background in scaling B2B SaaS in APAC aligns with your growth plans..."
                  rows={3}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-xs">
                    Your current job search status
                  </label>
                  <div className="relative">
                    <select
                      value={jobStatus}
                      onChange={(e) => setJobStatus(e.target.value)}
                      className="flex h-10 w-full appearance-none rounded-xl border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-xs">
                    Availability to start
                  </label>
                  <div className="relative">
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="flex h-10 w-full appearance-none rounded-xl border border-input bg-background pl-3 pr-8 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {START_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-xs">
                  What&apos;s the #1 achievement or skill you want to highlight?
                </label>
                <Textarea
                  value={keyAchievement}
                  onChange={(e) => setKeyAchievement(e.target.value)}
                  placeholder="e.g. Led a rebrand that increased inbound leads by 40% in 6 months across 3 APAC markets"
                  rows={2}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-xs">
                  Anything else to mention? (optional)
                </label>
                <Textarea
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  placeholder="e.g. Career gaps, relocation plans, visa status, language skills..."
                  rows={2}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Writing your cover letter...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </div>
          </GlassCard>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-600 dark:border-red-800/30 dark:bg-red-950/20 text-sm">
              {error}
            </div>
          )}

          {/* Result */}
          {coverLetter && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard>
                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Your Cover Letter</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? (
                          <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <ExportBar
                        resumeText={coverLetter}
                        title="Cover Letter"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadHtml}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        HTML
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCoverLetter("");
                          setSubjectLine("");
                        }}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Reset
                      </Button>
                    </div>
                  </div>

                  {subjectLine && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="font-medium text-xs">Subject:</p>
                      <p className="text-sm">{subjectLine}</p>
                    </div>
                  )}

                  <div className="rounded-lg border bg-card p-5">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {coverLetter}
                    </pre>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
