import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/claude";
import {
  buildAnalyzePrompt,
  buildTailorPrompt,
  buildHallucinationCheckPrompt,
} from "@/lib/prompts";
import { parseClaudeJSON } from "@/lib/parser";
import type {
  TailorRequest,
  AnalysisResult,
  ImprovementSummary,
} from "@/lib/types";
import { MAX_JD_LENGTH, MAX_RESUME_LENGTH } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body: TailorRequest = await request.json();

    // Validate
    if (!body.action || !["analyze", "tailor", "fetch-url"].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (body.action === "fetch-url") {
      return handleFetchUrl(body.url || "");
    }

    if (!body.jobDescription?.trim() || !body.resume?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Job description and resume are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (body.jobDescription.length > MAX_JD_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Job description exceeds ${MAX_JD_LENGTH} character limit`,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (body.resume.length > MAX_RESUME_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Resume exceeds ${MAX_RESUME_LENGTH} character limit`,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === "your-api-key-here") {
      return NextResponse.json(
        {
          success: false,
          error: "DEEPSEEK_API_KEY is not configured. Add your API key to .env.local",
          code: "VALIDATION_ERROR",
        },
        { status: 500 }
      );
    }

    if (body.action === "analyze") {
      return handleAnalyze(body.jobDescription, body.resume);
    }

    if (body.action === "tailor") {
      if (!body.tone || !body.analysis) {
        return NextResponse.json(
          {
            success: false,
            error: "Tone and analysis are required for tailoring",
            code: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }
      return handleTailor(
        body.jobDescription,
        body.resume,
        body.tone,
        body.analysis
      );
    }
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
        code: "CLAUDE_ERROR",
      },
      { status: 500 }
    );
  }
}

async function handleFetchUrl(url: string) {
  if (!url || !url.startsWith("http")) {
    return NextResponse.json(
      { success: false, error: "A valid URL is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ResumeTailor/1.0; +resume-tailor-bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    const html = await res.text();

    // Simple HTML to text extraction
    const stripped = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    if (!stripped || stripped.length < 100) {
      return NextResponse.json(
        { success: false, error: "Could not extract meaningful content from this URL", code: "PARSE_ERROR" },
        { status: 400 }
      );
    }

    const maxLength = 15000;
    const truncated = stripped.length > maxLength ? stripped.slice(0, maxLength) + "\n\n... (content truncated)" : stripped;

    return NextResponse.json({
      success: true,
      action: "fetch-url" as const,
      data: { text: truncated },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to fetch URL content",
        code: "CLAUDE_ERROR",
      },
      { status: 500 }
    );
  }
}

async function handleAnalyze(jd: string, resume: string) {
  const { system, user } = buildAnalyzePrompt(jd, resume);

  let raw = "";
  let analysis: AnalysisResult;

  try {
    raw = await callDeepSeek(system, user, { maxTokens: 2048, temperature: 0.2 });
    analysis = parseClaudeJSON<AnalysisResult>(raw);
  } catch {
    // Retry once with explicit JSON instruction
    const retrySystem =
      system +
      "\n\nCRITICAL: You MUST return ONLY valid JSON. No markdown, no code fences, no additional text.";
    raw = await callDeepSeek(retrySystem, user, {
      maxTokens: 2048,
      temperature: 0.1,
    });
    analysis = parseClaudeJSON<AnalysisResult>(raw);
  }

  // Clamp values
  analysis.atsScore = Math.max(0, Math.min(100, Math.round(analysis.atsScore)));
  analysis.keywordCoverage = Math.max(
    0,
    Math.min(100, Math.round(analysis.keywordCoverage))
  );

  return NextResponse.json({
    success: true,
    action: "analyze" as const,
    data: analysis,
  });
}

async function handleTailor(
  jd: string,
  resume: string,
  tone: string,
  analysis: AnalysisResult
) {
  const { system, user } = buildTailorPrompt(
    jd,
    resume,
    tone as "corporate-professional" | "modern-startup" | "executive" | "concise-ats" | "results-driven",
    analysis
  );

  let raw = "";
  let tailored: { tailoredResume: string; improvements: ImprovementSummary };

  try {
    raw = await callDeepSeek(system, user, {
      maxTokens: 4096,
      temperature: 0.4,
    });
    tailored = parseClaudeJSON<{
      tailoredResume: string;
      improvements: ImprovementSummary;
    }>(raw);
  } catch {
    const retrySystem =
      system +
      "\n\nCRITICAL: You MUST return ONLY valid JSON. No markdown, no code fences, no additional text.";
    raw = await callDeepSeek(retrySystem, user, {
      maxTokens: 4096,
      temperature: 0.2,
    });
    tailored = parseClaudeJSON<{
      tailoredResume: string;
      improvements: ImprovementSummary;
    }>(raw);
  }

  // Hallucination check
  try {
    const { system: hallSystem, user: hallUser } =
      buildHallucinationCheckPrompt(resume, tailored.tailoredResume);
    const hallRaw = await callDeepSeek(hallSystem, hallUser, {
      maxTokens: 512,
      temperature: 0.0,
    });
    const hallResult = parseClaudeJSON<{
      passed: boolean;
      violations: string[];
    }>(hallRaw);

    if (!hallResult.passed && hallResult.violations.length > 0) {
      return NextResponse.json({
        success: true,
        action: "tailor" as const,
        data: {
          tailoredResume: tailored.tailoredResume,
          improvements: {
            ...tailored.improvements,
            recruiterNotes: [
              ...tailored.improvements.recruiterNotes,
              `Note: Some AI additions were flagged for review: ${hallResult.violations.join("; ")}`,
            ],
          },
        },
      });
    }
  } catch {
    // Hallucination check failed gracefully — still return the result
  }

  return NextResponse.json({
    success: true,
    action: "tailor" as const,
    data: tailored,
  });
}
