const GOOGLE_CSE_BASE = "https://www.googleapis.com/customsearch/v1";

interface GoogleSearchInput {
  keywords: string;
  location: string;
  country: string;
  limit?: number;
}

interface GoogleSearchItem {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
    jobposting?: Array<{
      title?: string;
      description?: string;
      dateposted?: string;
      hiringorganization?: string;
      employmenttype?: string;
      joblocation?: string;
      baseSalary?: { value?: string; currency?: string };
    }>;
  };
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

function getCredentials(): { apiKey: string; cx: string } | null {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx || apiKey === "your-google-cse-key" || cx === "your-search-engine-id") {
    return null;
  }
  return { apiKey, cx };
}

function inferSource(url: string): string {
  if (url.includes("seek.com.au")) return "SEEK";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("indeed.com")) return "Indeed";
  if (url.includes("jora.com")) return "Jora";
  if (url.includes("ethicaljobs")) return "EthicalJobs";
  if (url.includes("workforceaustralia")) return "Workforce Australia";
  if (url.includes("glassdoor")) return "Glassdoor";
  return "Web";
}

function extractCompany(item: GoogleSearchItem, title: string): string {
  if (item.pagemap?.jobposting?.[0]?.hiringorganization) {
    return item.pagemap.jobposting[0].hiringorganization;
  }
  const parts = title.split(" - ");
  if (parts.length >= 2) return parts[parts.length - 1].trim();
  if (parts.length >= 2) return parts[1].trim();
  return "See listing";
}

function extractSalary(item: GoogleSearchItem): string {
  const jp = item.pagemap?.jobposting?.[0];
  if (jp?.baseSalary?.value) {
    const currency = jp.baseSalary.currency || "AUD";
    return `${currency} ${jp.baseSalary.value}`;
  }
  const snippet = item.snippet || "";
  const salaryMatch = snippet.match(/\$[\d,]+(?:\s*[-–]\s*\$?[\d,]+)?/);
  if (salaryMatch) return `AUD ${salaryMatch[0].replace(/\$/g, "").trim()}`;
  return "Not disclosed";
}

function extractEmploymentType(item: GoogleSearchItem): string {
  const jp = item.pagemap?.jobposting?.[0];
  if (jp?.employmenttype) return jp.employmenttype;
  return "Full-time";
}

function formatJob(item: GoogleSearchItem, location: string): StructuredJob {
  const title = item.title || "Untitled";
  const directUrl = item.link || "";
  const source = inferSource(directUrl);

  return {
    title: title.split(" - ")[0]?.trim() || title,
    company: extractCompany(item, title),
    location,
    directUrl,
    description: item.snippet || "",
    salary: extractSalary(item),
    experienceRequirements: "See listing",
    skillsRequired: [],
    employmentType: extractEmploymentType(item),
    source,
    postedDate: item.pagemap?.jobposting?.[0]?.dateposted || "Recently",
  };
}

export async function searchGoogleJobs(
  input: GoogleSearchInput
): Promise<StructuredJob[] | null> {
  const creds = getCredentials();
  if (!creds) return null;

  const query = `${input.keywords} job ${input.location} ${input.country}`;
  const num = Math.min(input.limit || 8, 10);

  const url = new URL(GOOGLE_CSE_BASE);
  url.searchParams.set("key", creds.apiKey);
  url.searchParams.set("cx", creds.cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", num.toString());
  url.searchParams.set("cr", "countryAU"); // restrict to Australian sites
  url.searchParams.set("gl", "au"); // geolocation = Australia
  url.searchParams.set("lr", "lang_en");

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error("Google CSE error:", response.status, await response.text().catch(() => ""));
      return null;
    }

    const json = await response.json();
    const items: GoogleSearchItem[] = json.items || [];

    if (items.length === 0) return null;

    return items.map((item) => formatJob(item, input.location));
  } catch (err) {
    console.error("Google CSE search failed:", err);
    return null;
  }
}
