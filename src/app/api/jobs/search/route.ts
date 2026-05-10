import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/claude";
import { parseClaudeJSON } from "@/lib/parser";
import { searchAdzunaJobs, type StructuredJob } from "@/lib/adzuna";
import { searchDuckDuckGoJobs } from "@/lib/duckduckgo";

interface JobListing extends StructuredJob {}

interface EnrichResult {
  jobs: JobListing[];
  searchNote: string;
}

export async function POST(request: Request) {
  try {
    const body: {
      keywords: string;
      location: string;
      country: string;
      experienceYears?: number;
      limit?: number;
    } = await request.json();

    if (!body.keywords?.trim() || !body.location?.trim()) {
      return NextResponse.json(
        { success: false, error: "Keywords and location are required" },
        { status: 400 }
      );
    }

    const { keywords, location, country, experienceYears, limit: reqLimit } = body;
    const limit = reqLimit ?? 15;
    const countryName = country?.trim() || "Australia";

    const allJobs: JobListing[] = [];
    const errors: string[] = [];

    // Source 1: Adzuna — primary, best quality individual job listings
    try {
      const adzunaJobs = await searchAdzunaJobs({
        keywords: keywords.trim(),
        location: location.trim(),
        country: countryName,
        limit, // take full limit — Adzuna has the best data
      });
      if (adzunaJobs && adzunaJobs.length > 0) {
        allJobs.push(...adzunaJobs);
      }
    } catch (err) {
      errors.push(`Adzuna: ${(err as Error).message}`);
    }

    // Source 2: DuckDuckGo — supplements with web search for individual listings
    if (allJobs.length < limit) {
      try {
        const ddgJobs = await searchDuckDuckGoJobs({
          keywords: keywords.trim(),
          location: location.trim(),
          country: countryName,
          limit: limit * 2, // wider net, filtered down later
        });
        if (ddgJobs && ddgJobs.length > 0) {
          allJobs.push(...ddgJobs);
        }
      } catch (err) {
        errors.push(`DuckDuckGo: ${(err as Error).message}`);
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    let uniqueJobs = allJobs.filter((j) => {
      if (seen.has(j.directUrl)) return false;
      seen.add(j.directUrl);
      return true;
    });

    // Client-side filter: rank by keyword match in title
    const keywordParts = keywords.toLowerCase().split(/\s+/);
    uniqueJobs = uniqueJobs
      .map((j) => {
        const titleLower = j.title.toLowerCase();
        const matchCount = keywordParts.filter((kw) => titleLower.includes(kw)).length;
        return { job: j, matchCount };
      })
      .filter(({ matchCount }) => matchCount >= Math.ceil(keywordParts.length / 2)) // at least half the keywords match
      .sort((a, b) => b.matchCount - a.matchCount)
      .map(({ job }) => job);

    if (uniqueJobs.length > 0) {
      // AI enrichment: only extract skills from job descriptions, preserve all original data
      const enriched = await enrichWithAI(
        uniqueJobs.slice(0, limit),
        keywords,
        experienceYears,
        countryName
      );

      return NextResponse.json({
        success: true,
        data: {
          jobs: enriched.jobs,
          totalFound: uniqueJobs.length,
          searchNote: `${uniqueJobs.length} real jobs from ${[...new Set(uniqueJobs.map((j) => j.source))].join(", ")}`,
          dataSource: "live",
        },
      });
    }

    // Fallback: AI generates listings
    console.log(`All sources failed or returned 0 results: ${errors.join("; ")}`);
    return generateFallbackListings(keywords, location, countryName, experienceYears, limit);
  } catch (err) {
    console.error("Job search error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Job search failed",
      },
      { status: 500 }
    );
  }
}

async function enrichWithAI(
  jobs: JobListing[],
  keywords: string,
  experienceYears: number | undefined,
  countryName: string
): Promise<EnrichResult> {
  if (jobs.length === 0) return { jobs, searchNote: "" };

  // If JSearch already provided skills and experience, skip AI enrichment to save cost
  const needsEnrichment = jobs.some(
    (j) => !j.skillsRequired?.length || j.experienceRequirements === "Not specified"
  );
  if (!needsEnrichment) {
    return {
      jobs,
      searchNote: `${jobs.length} live ${keywords} roles in ${countryName}`,
    };
  }

  const jobListJson = JSON.stringify(
    jobs.map((j) => ({
      title: j.title,
      company: j.company,
      description: j.description?.slice(0, 300),
      salary: j.salary,
      source: j.source,
    }))
  );

  const system = `You analyze job descriptions and extract relevant skills.

Return ONLY valid JSON:
{
  "jobs": [
    {
      "title": "keep original exactly",
      "company": "keep original exactly",
      "location": "keep original exactly",
      "directUrl": "KEEP EXACTLY AS PROVIDED — do not modify or regenerate",
      "description": "keep original exactly",
      "salary": "keep original exactly",
      "experienceRequirements": "keep original exactly",
      "skillsRequired": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
      "employmentType": "keep original exactly",
      "source": "keep original exactly",
      "postedDate": "keep original exactly"
    }
  ],
  "searchNote": "keep original or brief 1 sentence"
}

CRITICAL RULES:
1. ONLY change the "skillsRequired" field — extract 5-8 real skills from the job description/title
2. ALL other fields MUST stay EXACTLY as provided — do not rewrite, improve, or modify them
3. directUrl MUST stay identical — these are real application links, do not change`;

  const user = `Extract skills for each job from their titles and descriptions:\n${jobListJson}`;

  try {
    const raw = await callDeepSeek(system, user, { maxTokens: 2048 });
    const enriched = parseClaudeJSON<EnrichResult>(raw);

    // Force-restore all original fields — AI only touches skillsRequired
    enriched.jobs = enriched.jobs.map((j, i) => ({
      ...j,
      title: jobs[i]?.title || j.title,
      company: jobs[i]?.company || j.company,
      location: jobs[i]?.location || j.location,
      directUrl: jobs[i]?.directUrl || j.directUrl,
      description: jobs[i]?.description || j.description,
      salary: jobs[i]?.salary || j.salary,
      experienceRequirements: jobs[i]?.experienceRequirements || j.experienceRequirements,
      employmentType: jobs[i]?.employmentType || j.employmentType,
      source: jobs[i]?.source || j.source,
      postedDate: jobs[i]?.postedDate || j.postedDate,
      // skillsRequired is the only field AI is allowed to change
    }));

    return enriched;
  } catch {
    return { jobs, searchNote: "" };
  }
}

function buildPlatformSearchUrl(title: string, location: string, source: string): string {
  switch (source) {
    case "SEEK":
      return `https://www.seek.com.au/jobs?keywords=${encodeURIComponent(title)}&where=${encodeURIComponent(location)}`;
    case "LinkedIn":
      return `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`;
    case "Indeed":
      return `https://au.indeed.com/jobs?q=${encodeURIComponent(title)}&l=${encodeURIComponent(location)}`;
    default:
      return `https://www.seek.com.au/jobs?keywords=${encodeURIComponent(title)}&where=${encodeURIComponent(location)}`;
  }
}

async function generateFallbackListings(
  keywords: string,
  location: string,
  countryName: string,
  experienceYears: number | undefined,
  limit: number
) {
  let experienceFilter = "";
  let expMsg = "";
  if (experienceYears && experienceYears > 0) {
    const minRelevant = Math.max(1, Math.floor(experienceYears * 0.5));
    const maxMatch = experienceYears + 3;
    experienceFilter = `The candidate has ${experienceYears} years of experience. Only return jobs requiring between ${minRelevant} and ${maxMatch} years.`;
    expMsg = ` for someone with ${experienceYears} years of experience`;
  }

  const system = `You are a job search assistant. Generate realistic job listings for ${keywords} in ${location}, ${countryName}.

Return ONLY valid JSON:
{
  "jobs": [
    {
      "title": "realistic job title",
      "company": "real company in ${location}, ${countryName}",
      "location": "e.g. 'Perth WA, Australia'",
      "directUrl": "platform search link for this role",
      "description": "2-3 sentence overview",
      "salary": "e.g. 'AUD 90,000 – 110,000 per annum'",
      "experienceRequirements": "e.g. '5–8 years in marketing'",
      "skillsRequired": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
      "employmentType": "Full-time | Part-time | Contract",
      "source": "SEEK | LinkedIn | Indeed | Company Website | EthicalJobs | Jora",
      "postedDate": "e.g. '3 days ago'"
    }
  ],
  "searchNote": "brief note"
}

RULES:
- ALL jobs must be in ${countryName}. If "${location}" exists in multiple countries, ONLY use ${countryName}.
- ${experienceFilter}
- Distribute across different sources (SEEK, LinkedIn, Indeed, etc.)
- Companies: use well-known employers in ${location}, ${countryName}
- Dates: within last 30 days
- directUrl: use REAL working search URLs (NOT fake page IDs). Format:
  SEEK → https://www.seek.com.au/jobs?keywords=[title]&where=[location]
  LinkedIn → https://www.linkedin.com/jobs/search?keywords=[title]&location=[location]
  Indeed → https://au.indeed.com/jobs?q=[title]&l=[location]`;

  const user = `Find ${limit} ${keywords} roles in ${location}, ${countryName}${expMsg}.`;

  const raw = await callDeepSeek(system, user, { maxTokens: 4096, temperature: 0.6 });
  const result = parseClaudeJSON<EnrichResult>(raw);

  const jobs = result.jobs.slice(0, limit).map((job) => ({
    ...job,
    skillsRequired: job.skillsRequired || [],
    directUrl:
      job.directUrl && job.directUrl.startsWith("http")
        ? job.directUrl
        : buildPlatformSearchUrl(job.title, job.location, job.source),
  }));

  return NextResponse.json({
    success: true,
    data: {
      jobs,
      totalFound: result.jobs.length,
      searchNote: result.searchNote || "AI-generated (JSearch key not configured)",
      dataSource: "ai-fallback",
    },
  });
}
