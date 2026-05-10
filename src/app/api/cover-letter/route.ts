import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/claude";

const STATUS_CONTEXT: Record<string, string> = {
  "actively-applying": "The candidate is actively applying and interviewing. The letter should convey urgency and enthusiasm.",
  "casually-exploring": "The candidate is casually exploring. The letter should express genuine interest without desperation.",
  "employed-open": "The candidate is currently employed but open to new opportunities. The letter should be confident and selective in tone.",
  relocating: "The candidate is planning to relocate to the area. The letter should address their commitment to the location.",
  "career-change": "The candidate is transitioning careers. The letter should frame their transferable skills convincingly.",
  returning: "The candidate is returning to the workforce after a break. The letter should address this positively and focus on readiness.",
};

const AVAILABILITY_CONTEXT: Record<string, string> = {
  immediately: "The candidate is available immediately.",
  "2-weeks": "The candidate can start in 2 weeks.",
  "4-weeks": "The candidate has a 4-week notice period.",
  negotiable: "The candidate's start date is negotiable.",
};

export async function POST(request: Request) {
  try {
    const body: {
      jobDescription: string;
      resume: string;
      companyName?: string;
      whyThisRole?: string;
      jobStatus?: string;
      keyAchievement?: string;
      availability?: string;
      extraNotes?: string;
    } = await request.json();

    if (!body.jobDescription?.trim() || !body.resume?.trim()) {
      return NextResponse.json(
        { success: false, error: "Job description and resume are required" },
        { status: 400 }
      );
    }

    const companyName = body.companyName?.trim() || "[Company Name]";
    const whyThisRole = body.whyThisRole?.trim() || "";
    const jobStatus = body.jobStatus?.trim() || "";
    const keyAchievement = body.keyAchievement?.trim() || "";
    const availability = body.availability?.trim() || "";
    const extraNotes = body.extraNotes?.trim() || "";

    // Build personalised context
    let personalContext = "";
    if (whyThisRole) {
      personalContext += `\nWHY THIS ROLE (CRITICAL — weave this naturally into the opening paragraph): ${whyThisRole}`;
    }
    if (jobStatus) {
      personalContext += `\nCANDIDATE SITUATION: ${STATUS_CONTEXT[jobStatus] || jobStatus}`;
    }
    if (keyAchievement) {
      personalContext += `\nKEY ACHIEVEMENT TO HIGHLIGHT (CRITICAL — feature this prominently with specific metrics): ${keyAchievement}`;
    }
    if (availability) {
      personalContext += `\nAVAILABILITY: ${AVAILABILITY_CONTEXT[availability] || availability}`;
    }
    if (extraNotes) {
      personalContext += `\nADDITIONAL CONTEXT: ${extraNotes}`;
    }

    const hasPersonalContext = !!personalContext;

    // Detect if user wrote answers in Chinese — generate in English anyway
    const allUserText = [whyThisRole, keyAchievement, extraNotes, body.resume, body.jobDescription].join(" ");
    const hasChinese = /[一-鿿]/.test(allUserText);

    const system = `You are an expert cover letter writer who crafts deeply personal, authentic letters that resonate with hiring managers in the Australian job market.${hasChinese ? `\n\nIMPORTANT: The candidate wrote some inputs in Chinese. Understand their Chinese responses fully, but ALWAYS generate the cover letter in NATIVE-LEVEL English. Translate their intent and emotion, not their words literally. The output must sound like a fluent English speaker wrote it.` : ""}

${hasPersonalContext ? `CRITICAL: The candidate has provided personal context about why they want this role and what they bring. Weave this into the letter naturally — do NOT copy-paste, but integrate their authentic voice and specific motivations throughout. This is what separates a generic AI letter from a compelling human one.` : `The candidate has NOT provided personal context. Make reasonable assumptions based on their resume.`}

Guidelines:
- Address the letter to the hiring team at ${companyName}
- OPEN WITH A HOOK — mention something specific about ${companyName} and the role. NEVER start with "I am writing to apply..."
- Body: connect the candidate's experience to the job requirements using specific examples
- ${hasPersonalContext ? "Use their personal 'why' to make the letter emotionally compelling" : "Infer genuine interest from their resume and the JD"}
- Use Australian business English (colour, organise, -ise not -ize, programme not program)
- Keep to one page (350-450 words)
- Close with a confident, specific call to action
- Include a subject line

${personalContext}

Return ONLY valid JSON (no markdown):
{
  "coverLetter": "the full cover letter text",
  "subjectLine": "email subject line"
}`;

    const user = `Job Description:\n${body.jobDescription.slice(0, 3000)}\n\nResume:\n${body.resume.slice(0, 4000)}${hasChinese ? "\n\nNOTE: Some inputs above are in Chinese. Understand them to capture the candidate's authentic voice and motivation, but always produce the cover letter in fluent English." : ""}`;

    const raw = await callDeepSeek(system, user, { maxTokens: 2000, temperature: 0.7 });

    // Extract JSON from the response
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    const json = JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      data: {
        coverLetter: json.coverLetter || "",
        subjectLine: json.subjectLine || `Application: ${body.jobDescription.slice(0, 60)}...`,
      },
    });
  } catch (err) {
    console.error("Cover letter generation error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
