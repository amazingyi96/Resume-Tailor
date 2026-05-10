const ADZUNA_BASE = "https://api.adzuna.com/v1/api";

interface AdzunaInput {
  keywords: string;
  location: string;
  country: string;
  limit?: number;
}

interface AdzunaRawJob {
  id?: string;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  contract_type?: string;
  contract_time?: string;
  category?: { label?: string; tag?: string };
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

function getCredentials(): { appId: string; appKey: string } | null {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey || appId === "your-adzuna-app-id" || appKey === "your-adzuna-app-key") {
    return null;
  }
  return { appId, appKey };
}

function formatSalary(raw: AdzunaRawJob): string {
  if (raw.salary_min && raw.salary_max) {
    const pred = raw.salary_is_predicted === "1" ? " (est.)" : "";
    return `AUD ${raw.salary_min.toLocaleString()} – ${raw.salary_max.toLocaleString()}${pred}`;
  }
  if (raw.salary_min) return `AUD ${raw.salary_min.toLocaleString()}+`;
  if (raw.salary_max) return `Up to AUD ${raw.salary_max.toLocaleString()}`;
  return "Not disclosed";
}

function formatEmploymentType(raw: AdzunaRawJob): string {
  const types: string[] = [];
  if (raw.contract_type) types.push(raw.contract_type.charAt(0).toUpperCase() + raw.contract_type.slice(1));
  if (raw.contract_time) types.push(raw.contract_time.charAt(0).toUpperCase() + raw.contract_time.slice(1));
  return types.length > 0 ? types.join(" / ") : "Full-time";
}

function formatDate(created?: string): string {
  if (!created) return "Recently";
  const posted = new Date(created);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function formatJob(raw: AdzunaRawJob): StructuredJob {
  return {
    title: raw.title || "Untitled Position",
    company: raw.company?.display_name || "Confidential",
    location: raw.location?.display_name || "Australia",
    directUrl: raw.redirect_url || "",
    description: (raw.description || "").replace(/<[^>]+>/g, "").trim().slice(0, 2500),
    salary: formatSalary(raw),
    experienceRequirements: "See listing",
    skillsRequired: [],
    employmentType: formatEmploymentType(raw),
    source: "Adzuna",
    postedDate: formatDate(raw.created),
  };
}

const AU_LOCATION_MAP: Record<string, string> = {
  perth: "Perth",
  sydney: "Sydney",
  melbourne: "Melbourne",
  brisbane: "Brisbane",
  adelaide: "Adelaide",
  "gold coast": "Gold Coast",
  newcastle: "Newcastle",
  canberra: "Canberra",
  hobart: "Hobart",
  darwin: "Darwin",
  geelong: "Geelong",
  wollongong: "Wollongong",
  townsville: "Townsville",
  cairns: "Cairns",
  ballarat: "Ballarat",
  bendigo: "Bendigo",
  launceston: "Launceston",
};

function mapLocation(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [key, value] of Object.entries(AU_LOCATION_MAP)) {
    if (lower.includes(key)) return value;
  }
  return raw.trim();
}

export async function searchAdzunaJobs(
  input: AdzunaInput
): Promise<StructuredJob[] | null> {
  const creds = getCredentials();
  if (!creds) return null;

  const resultsPerPage = Math.min(input.limit || 15, 50);
  const where = input.location.trim(); // pass raw — Adzuna does fuzzy matching

  // Fetch up to 2 pages for better coverage
  const allJobs: StructuredJob[] = [];

  for (let page = 1; page <= 2; page++) {
    const url = new URL(`${ADZUNA_BASE}/jobs/au/search/${page}`);
    url.searchParams.set("app_id", creds.appId);
    url.searchParams.set("app_key", creds.appKey);
    url.searchParams.set("what", input.keywords.trim());
    url.searchParams.set("where", where);
    url.searchParams.set("results_per_page", resultsPerPage.toString());

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error(`Adzuna page ${page} error:`, response.status);
        break;
      }

      const json = await response.json();
      const pageJobs: AdzunaRawJob[] = json.results || [];

      if (pageJobs.length === 0) break;

      allJobs.push(...pageJobs.map(formatJob));

      if (allJobs.length >= resultsPerPage) break;
    } catch (err) {
      console.error(`Adzuna page ${page} failed:`, err);
      break;
    }
  }

  return allJobs.length > 0 ? allJobs.slice(0, resultsPerPage) : null;
}
