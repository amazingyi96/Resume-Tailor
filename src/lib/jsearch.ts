const JSEARCH_HOST = "jsearch.p.rapidapi.com";
const JSEARCH_BASE = "https://jsearch.p.rapidapi.com";

interface JSearchInput {
  keywords: string;
  location: string;
  country: string;
  limit?: number;
}

interface JSearchRawJob {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  employer_logo?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description?: string;
  job_apply_link?: string;
  job_employment_type?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_salary_period?: string;
  job_posted_at_datetime_utc?: string;
  employer_website?: string;
  job_required_skills?: string[];
  job_required_experience?: {
    minimum_years?: number;
    maximum_years?: number;
    required_experience_in_months?: number;
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

function getApiKey(): string {
  return process.env.JSEARCH_API_KEY || "";
}

function isConfigured(): boolean {
  const key = getApiKey();
  return !!key && key.length > 10 && key !== "your-jsearch-api-key";
}

function inferSource(url: string): string {
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("indeed.com")) return "Indeed";
  if (url.includes("glassdoor.com")) return "Glassdoor";
  if (url.includes("seek.com.au")) return "SEEK";
  return "Job Board";
}

function formatJob(raw: JSearchRawJob): StructuredJob {
  const title = raw.job_title || "Untitled Position";
  const company = raw.employer_name || "Confidential";
  const city = raw.job_city || "";
  const state = raw.job_state || "";
  const country = raw.job_country || "";
  const location = [city, state, country].filter(Boolean).join(", ");
  const directUrl = raw.job_apply_link || "";
  const description = (raw.job_description || "").replace(/<[^>]+>/g, "").trim();
  const source = inferSource(directUrl);
  const employmentType = raw.job_employment_type || "Full-time";

  // Salary
  let salary = "Not disclosed";
  if (raw.job_min_salary && raw.job_max_salary) {
    const currency = raw.job_salary_currency || "AUD";
    const period = raw.job_salary_period
      ? ` per ${raw.job_salary_period.toLowerCase()}`
      : "";
    salary = `${currency} ${raw.job_min_salary.toLocaleString()} – ${raw.job_max_salary.toLocaleString()}${period}`;
  } else if (raw.job_min_salary) {
    salary = `${raw.job_salary_currency || "AUD"} ${raw.job_min_salary.toLocaleString()}`;
  }

  // Experience
  let experienceRequirements = "Not specified";
  const exp = raw.job_required_experience;
  if (exp) {
    if (exp.minimum_years && exp.maximum_years) {
      experienceRequirements = `${exp.minimum_years}–${exp.maximum_years} years`;
    } else if (exp.minimum_years) {
      experienceRequirements = `${exp.minimum_years}+ years`;
    } else if (exp.required_experience_in_months) {
      const yrs = Math.round(exp.required_experience_in_months / 12);
      experienceRequirements = `${yrs}+ years`;
    }
  }

  // Skills
  const skills = raw.job_required_skills || [];

  // Posted date
  let postedDate = "Recently";
  if (raw.job_posted_at_datetime_utc) {
    const posted = new Date(raw.job_posted_at_datetime_utc);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) postedDate = "Today";
    else if (diffDays === 1) postedDate = "1 day ago";
    else if (diffDays < 7) postedDate = `${diffDays} days ago`;
    else if (diffDays < 30) postedDate = `${Math.floor(diffDays / 7)} weeks ago`;
    else postedDate = `${Math.floor(diffDays / 30)} months ago`;
  }

  return {
    title,
    company,
    location,
    directUrl,
    description: description.slice(0, 800),
    salary,
    experienceRequirements,
    skillsRequired: skills,
    employmentType,
    source,
    postedDate,
  };
}

export async function searchJSearchJobs(
  input: JSearchInput
): Promise<StructuredJob[]> {
  if (!isConfigured()) {
    throw new Error("JSEARCH_API_KEY not configured");
  }

  const query = `${input.keywords} in ${input.location}`;
  const limit = input.limit || 8;

  // Map country name to 2-letter code for JSearch
  const countryCode =
    input.country.toLowerCase().includes("australia") ? "au" :
    input.country.toLowerCase().includes("new zealand") ? "nz" :
    input.country.toLowerCase().includes("united kingdom") ? "gb" :
    input.country.toLowerCase().includes("canada") ? "ca" :
    input.country.toLowerCase().includes("united states") ? "us" :
    "au";

  const url = new URL(`${JSEARCH_BASE}/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("page", "1");
  url.searchParams.set("num_pages", Math.min(Math.ceil(limit / 10), 3).toString());
  url.searchParams.set("country", countryCode);
  url.searchParams.set("language", "en");

  const response = await fetch(url.toString(), {
    headers: {
      "X-RapidAPI-Key": getApiKey(),
      "X-RapidAPI-Host": JSEARCH_HOST,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`JSearch API error: ${response.status} ${text}`);
  }

  const json = await response.json();
  const jobs: JSearchRawJob[] = json.data || [];

  return jobs.slice(0, limit).map(formatJob);
}
