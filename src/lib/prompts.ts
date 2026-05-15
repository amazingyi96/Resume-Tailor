import type { AnalysisResult, ImprovementSummary, ToneStyle } from "./types";

const TONE_GUIDES: Record<ToneStyle, string> = {
  "corporate-professional": `Formal, polished language. Industry-standard terminology. Structured and professional formatting. Suitable for large corporations, financial services, and consulting firms.`,
  "modern-startup": `Direct, action-oriented language. Emphasizes impact, initiative, and agility. Avoids corporate jargon. Suitable for technology companies, startups, and innovative businesses.`,
  "executive": `Strategic, results-focused language. Boardroom-level communication. Emphasizes leadership, vision, and organizational impact. Suitable for senior leadership and director-level roles.`,
  "concise-ats": `Maximum keyword density. Minimal prose. Bullet-optimized for ATS scanning. Every line includes measurable outcomes or keywords from the job description. Suitable for high-volume applications.`,
  "results-driven": `Quantified achievements throughout. Metrics-focused language. ROI-oriented phrasing. Every bullet point demonstrates measurable business impact. Suitable for performance-focused organizations.`,
};

export function buildAnalyzePrompt(jd: string, resume: string) {
  const system = `You are an expert ATS (Applicant Tracking System) analyst and recruitment consultant specializing in the Australian job market.

Analyze the provided job description and resume. Return a structured JSON analysis.

Core tasks:
1. Extract all required skills, preferred skills, soft skills, and ATS keywords from the job description
2. Compare the resume against these requirements
3. Calculate an ATS match score (0-100) based on keyword presence, skill alignment, and experience relevance
4. Identify which keywords from the JD are present (matched) and which are missing
5. Provide 3-6 actionable, specific suggestions for improvement
6. If a company name or role title is identifiable in the JD, include it

Australian context:
- Australian recruiters value clear, concise language
- Use Australian spelling conventions (organise, behaviour, centre, programme)
- Australian companies value direct communication and authentic self-presentation
- Local market experience is highly valued

Output ONLY valid JSON. No markdown code fences, no preamble, no postamble. The JSON must match this exact structure:
{
  "atsScore": number (0-100),
  "keywordCoverage": number (0-100),
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "suggestions": string[] (3-6 specific, actionable items),
  "jdSummary": {
    "requiredSkills": string[],
    "preferredSkills": string[],
    "softSkills": string[],
    "atsKeywords": string[],
    "roleTitle": string,
    "companyName": string | null
  }
}`;

  const user = `JOB DESCRIPTION:\n\n${jd}\n\n---\n\nRESUME:\n\n${resume}`;

  return { system, user };
}

export function buildTailorPrompt(
  jd: string,
  resume: string,
  tone: ToneStyle,
  analysis: AnalysisResult
) {
  const toneGuide = TONE_GUIDES[tone];

  const system = `You are an expert resume writer and career coach specializing in the Australian job market. You rewrite resumes to maximize ATS compatibility while appealing to human recruiters.

Rewrite the provided resume to better align with the job description below.

Tone style to apply: ${toneGuide}

ANTI-HALLUCINATION RULES (CRITICAL):
You MUST NOT invent or fabricate ANY of the following:
- Job titles, company names, employment dates, or durations
- Specific metrics, numbers, percentages, or dollar amounts not in the original resume
- Tools, technologies, software, or programming languages not in the original resume
- Certifications, degrees, GPAs, or educational qualifications not in the original resume
- Awards, honors, or recognitions not in the original resume
- Project names, client names, or team sizes not in the original resume
- Any experience, role, or responsibility not described in the original resume

You MAY:
- Reorder, rephrase, and restructure existing bullet points for stronger impact
- Strengthen weak verbs with more powerful action verbs (e.g., "helped" → "drove")
- Surface relevant experience that was buried or de-emphasized
- Add ATS keywords from the JD into the skills section ONLY if those skills can be reasonably inferred from the resume content (e.g., if they used Marketo, adding "Marketing Automation" is reasonable)
- Improve readability, flow, and professional formatting
- Rephrase to be more concise and impactful
- Apply Australian spelling conventions

When in doubt, preserve the original text rather than risk fabrication. A conservative rewrite is better than an embellished one.

Australian context:
- Use Australian spelling (organise, behaviour, centre, programme, analyse, specialise)
- Australian recruiters prefer direct, genuine communication
- Clearly state Australian working rights status if present in the original resume
- Industry-specific terminology should be used correctly for the Australian market

Output ONLY valid JSON. No markdown code fences. The JSON must match this exact structure:
{
  "tailoredResume": "string (the complete rewritten resume as a single string)",
  "improvements": {
    "addedKeywords": string[] (keywords added based on JD relevance),
    "changedSections": string[] (sections that were modified),
    "recruiterNotes": string[] (2-4 notes for the candidate about what was improved and why)
  }
}`;

  const user = `JOB DESCRIPTION:\n\n${jd}\n\n---\n\nORIGINAL RESUME:\n\n${resume}\n\n---\n\nATS ANALYSIS:\n- Score: ${analysis.atsScore}/100\n- Matched keywords: ${analysis.matchedKeywords.join(", ")}\n- Missing keywords: ${analysis.missingKeywords.join(", ")}\n- Suggestions: ${analysis.suggestions.join("; ")}`;

  return { system, user };
}

export function buildHallucinationCheckPrompt(
  originalResume: string,
  tailoredResume: string
) {
  const system = `You are a verification system. Your job is to detect fabricated or invented information in a tailored resume that does NOT exist in the original resume.

Compare the original resume with the tailored version. Identify anything in the tailored version that appears to be fabricated, including but not limited to:
- New job titles or positions
- Changed company names
- Changed or new employment dates
- New metrics, percentages, numbers, or dollar amounts
- New tools, software, technologies, or programming languages
- New certifications, degrees, or GPA scores
- New awards, honors, or recognitions
- New project names, client names, or team sizes
- New responsibilities that cannot be inferred from the original

Different phrasing of the SAME experience is NOT a hallucination — it is good rewriting.
Reorganizing existing content is NOT a hallucination.
Using stronger verbs for the same action is NOT a hallucination.

Flag ONLY genuine fabrications. If none are found, return passed: true.

Output ONLY valid JSON:
{
  "passed": boolean,
  "violations": string[]
}`;

  const user = `ORIGINAL RESUME:\n\n${originalResume}\n\n---\n\nTAILORED RESUME:\n\n${tailoredResume}`;

  return { system, user };
}

export function buildJobExtractPrompt(pageText: string) {
  const system = `You are a job posting data extractor. Extract structured job details from the provided web page text (which may contain navigation, footer, and other non-job content mixed in with the actual job posting).

Return ONLY valid JSON. No markdown code fences, no preamble, no postamble. The JSON must match this exact structure:
{
  "company": string | null,
  "position": string | null,
  "location": string | null,
  "industry": string | null,
  "jobType": string | null,
  "salary": string | null
}

Rules:
- company: The hiring company name. Look for "About [Company]", "[Company] is hiring", or company branding.
- position: The job title / role name. Usually near the top of the listing.
- location: City and state/region. For Australian jobs, format like "Dubbo, NSW" or "Perth, WA". Include "Remote" if fully remote.
- industry: Infer from company type and role context. Use Australian-relevant categories like "Technology & IT", "Healthcare & Medical", "Education & Training", "Government & Public Sector", "Professional Services", "Tourism & Events", "Mining & Resources", "Agriculture & Farming", "Retail & Consumer Goods", "Manufacturing & Logistics", "Hospitality & Tourism", "Real Estate & Property", "Other".
- jobType: One of "Full-time", "Part-time", "Contract", "Casual", "Fixed-term", "Remote". Look for explicit mentions.
- salary: Salary range if explicitly mentioned. Keep original format (e.g. "$85,000 - $95,000" or "$90K + super").
- Return null for any field you cannot confidently determine. Do NOT guess or make up values.`;

  const user = `WEB PAGE TEXT:\n\n${pageText.slice(0, 12000)}`;

  return { system, user };
}
