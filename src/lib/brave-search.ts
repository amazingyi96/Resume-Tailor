const BRAVE_BASE = "https://api.search.brave.com/res/v1/web/search";

interface BraveSearchInput {
  keywords: string;
  location: string;
  country: string;
  limit?: number;
}

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
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

function getApiKey(): string {
  return process.env.BRAVE_SEARCH_API_KEY || "";
}

function isConfigured(): boolean {
  const key = getApiKey();
  return !!key && key.length > 10;
}

const JOB_BOARD_DOMAINS = [
  "seek.com.au",
  "linkedin.com/jobs",
  "au.indeed.com",
  "jora.com",
  "ethicaljobs.com.au",
  "workforceaustralia.gov.au",
  "careers.vic.gov.au",
  "careers.wa.gov.au",
  "iworkfor.nsw.gov.au",
  "smartjobs.qld.gov.au",
];

function isJobUrl(url: string): boolean {
  return JOB_BOARD_DOMAINS.some((domain) => url.includes(domain));
}

function inferSource(url: string): string {
  if (url.includes("seek.com.au")) return "SEEK";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("indeed.com")) return "Indeed";
  if (url.includes("jora.com")) return "Jora";
  if (url.includes("ethicaljobs")) return "EthicalJobs";
  if (url.includes("workforceaustralia")) return "Workforce Australia";
  if (url.includes("careers.") || url.includes("iworkfor.") || url.includes("smartjobs.")) return "Government";
  return "Job Board";
}

export async function searchBraveJobs(
  input: BraveSearchInput
): Promise<StructuredJob[] | null> {
  if (!isConfigured()) {
    return null;
  }

  const query = `${input.keywords} job ${input.location} ${input.country}`;
  const count = Math.min(input.limit || 8, 20);

  const url = new URL(BRAVE_BASE);
  url.searchParams.set("q", query);
  url.searchParams.set("count", count.toString());
  url.searchParams.set("country", input.country === "Australia" ? "AU" : input.country.slice(0, 2).toUpperCase());
  url.searchParams.set("search_lang", "en");
  url.searchParams.set("freshness", "pm"); // past month

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": getApiKey(),
      },
    });

    if (!response.ok) {
      console.error("Brave Search error:", response.status, await response.text());
      return null;
    }

    const json = await response.json();
    const results: BraveWebResult[] = json.web?.results || [];

    // Filter for job-related URLs
    const jobResults = results.filter((r) => isJobUrl(r.url));

    if (jobResults.length === 0) {
      return null;
    }

    return jobResults.slice(0, input.limit || 8).map((r) => ({
      title: r.title.split(" - ")[0]?.trim() || r.title,
      company: r.title.split(" - ")[1]?.split(" in ")[0]?.trim() || "See listing",
      location: input.location,
      directUrl: r.url,
      description: r.description || "",
      salary: "See listing",
      experienceRequirements: "See listing",
      skillsRequired: [],
      employmentType: "See listing",
      source: inferSource(r.url),
      postedDate: "Recently",
    }));
  } catch (err) {
    console.error("Brave Search failed:", err);
    return null;
  }
}
