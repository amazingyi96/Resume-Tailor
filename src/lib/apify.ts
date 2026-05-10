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
  companyName?: string;
  company?: string;
  location?: string;
  url?: string;
  link?: string;
  description?: string;
  salary?: string;
  datePosted?: string;
  employmentType?: string;
}

interface StructuredJob {
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

async function runGoogleJobsScraper(
  input: ApifyJobInput
): Promise<ApifyRawJob[]> {
  const token = getToken();
  const actorId = "curious_coder/linkedin-jobs-scraper";

  const response = await fetch(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${token}&waitForFinish=120`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords: input.keywords,
        location: `${input.location}, ${input.country}`,
        limit: input.limit || 8,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Apify actor start failed: ${response.status} ${errText}`);
  }

  const run = await response.json();
  const defaultDatasetId = run.data?.defaultDatasetId;

  if (!defaultDatasetId) {
    throw new Error("Apify run completed but no dataset found");
  }

  const datasetRes = await fetch(
    `${APIFY_BASE}/datasets/${defaultDatasetId}/items?token=${token}&limit=${input.limit || 8}`
  );

  if (!datasetRes.ok) {
    throw new Error("Failed to fetch Apify dataset");
  }

  return datasetRes.json();
}

function formatJob(raw: ApifyRawJob, idx: number): StructuredJob {
  const title = raw.title || "Untitled Position";
  const company = raw.companyName || raw.company || "Confidential";
  const location = raw.location || "Australia";
  const directUrl = raw.url || raw.link || "";
  const description = raw.description || "";
  const salary = raw.salary || "Not disclosed";
  const employmentType = raw.employmentType || "Full-time";
  const postedDate = raw.datePosted || "Recently";

  // Determine source from the URL
  let source = "Company Website";
  if (directUrl.includes("linkedin.com")) source = "LinkedIn";
  else if (directUrl.includes("seek.com.au")) source = "SEEK";
  else if (directUrl.includes("indeed.com")) source = "Indeed";
  else if (directUrl.includes("jora.com")) source = "Jora";
  else if (directUrl.includes("ethicaljobs")) source = "EthicalJobs";
  else if (directUrl.includes("google.com")) source = "Google Jobs";

  return {
    title,
    company,
    location,
    directUrl,
    description: description.slice(0, 600),
    salary,
    experienceRequirements: "See description",
    skillsRequired: [],
    employmentType,
    source,
    postedDate,
  };
}

export async function searchRealJobs(
  input: ApifyJobInput
): Promise<{ jobs: StructuredJob[]; source: string } | null> {
  if (!isTokenConfigured()) {
    console.log("Apify token not configured, skipping real job search");
    return null;
  }

  try {
    const rawJobs = await runGoogleJobsScraper(input);
    if (!rawJobs || rawJobs.length === 0) return null;

    const jobs = rawJobs.slice(0, input.limit || 8).map(formatJob);
    return { jobs, source: "apify" };
  } catch (err) {
    console.error("Apify job search failed:", err);
    return null;
  }
}
