const APIFY_BASE = "https://api.apify.com/v2";

interface ApifyJobInput {
  keywords: string;
  location: string;
  country: string;
  experienceYears?: number;
  limit?: number;
}

interface ApifyRawJob {
  title?: string;
  job_title?: string;
  companyName?: string;
  company_name?: string;
  location?: string;
  url?: string;
  job_url?: string;
  link?: string;
  description?: string;
  job_description?: string;
  salary?: string;
  salary_range?: string;
  postedDate?: string;
  time_posted?: string;
  employmentType?: string;
  employment_type?: string;
  seniority_level?: string;
  job_function?: string;
  industries?: string;
  easy_apply?: string;
  apply_url?: string;
}

export interface StructuredJob {
  title: string;
  company: string;
  location: string;
  directUrl: string;
  description: string;
  salary: string;
  experienceRequirements: string;
  skillsRequired: string[];
  employmentType: string;
  source: string;
  postedDate: string;
}

function getToken(): string {
  return process.env.APIFY_API_TOKEN || "";
}

function isTokenConfigured(): boolean {
  const token = getToken();
  return !!token && token.length > 10 && token !== "your-apify-token";
}

function formatDate(raw: string | undefined): string {
  if (!raw) return "Recently";
  // Handle "X hours ago", "X days ago" etc from time_posted
  if (raw.includes("hour") || raw.includes("minute") || raw.includes("day") || raw.includes("week")) {
    return raw;
  }
  // Handle ISO date strings
  try {
    const posted = new Date(raw);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return "Recently";
  }
}

function formatJob(raw: ApifyRawJob): StructuredJob {
  const title = raw.title || raw.job_title || "Untitled Position";
  const company = raw.companyName || raw.company_name || "Confidential";
  const location = raw.location || "Australia";
  const directUrl = raw.url || raw.job_url || raw.link || raw.apply_url || "";
  const description = (raw.description || raw.job_description || "").replace(/<[^>]+>/g, "").trim().slice(0, 2500);
  const salary = raw.salary || raw.salary_range || "Not disclosed";
  const employmentType = raw.employmentType || raw.employment_type || "Full-time";
  const postedDate = formatDate(raw.postedDate || raw.time_posted);

  return {
    title,
    company,
    location,
    directUrl,
    description,
    salary,
    experienceRequirements: raw.seniority_level ? `${raw.seniority_level} level` : "See listing",
    skillsRequired: [],
    employmentType,
    source: "LinkedIn",
    postedDate,
  };
}

export async function searchLinkedInJobs(
  input: ApifyJobInput
): Promise<StructuredJob[] | null> {
  if (!isTokenConfigured()) {
    console.log("Apify token not configured, skipping LinkedIn search");
    return null;
  }

  const token = getToken();
  const actorId = "valig~linkedin-jobs-scraper";
  const limit = Math.min(input.limit || 8, 20);

  try {
    // Start actor run
    const runUrl = `${APIFY_BASE}/acts/${actorId}/runs?token=${token}&waitForFinish=120`;
    const response = await fetch(runUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: input.keywords,
        location: `${input.location}, ${input.country}`,
        maxResults: limit,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Apify run failed: ${response.status} ${errText}`);
    }

    const run = await response.json();
    const defaultDatasetId = run.data?.defaultDatasetId;

    if (!defaultDatasetId) {
      console.log("Apify run completed but no dataset");
      return null;
    }

    // Fetch dataset items
    const datasetUrl = `${APIFY_BASE}/datasets/${defaultDatasetId}/items?token=${token}&limit=${limit}`;
    const datasetRes = await fetch(datasetUrl);

    if (!datasetRes.ok) {
      throw new Error("Failed to fetch Apify dataset");
    }

    const rawJobs: ApifyRawJob[] = await datasetRes.json();

    if (!rawJobs || rawJobs.length === 0) return null;

    const jobs = rawJobs.slice(0, limit).map(formatJob);
    return jobs;
  } catch (err) {
    console.error("Apify LinkedIn search failed:", err);
    return null;
  }
}
