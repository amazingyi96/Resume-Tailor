const DDG_LITE = "https://lite.duckduckgo.com/lite/";

interface DuckDuckGoInput {
  keywords: string;
  location: string;
  country: string;
  limit?: number;
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

function isIndividualJobUrl(url: string): boolean {
  // SEEK individual listing: /job/12345678 or /job/marketing-manager/12345678
  if (url.includes("seek.com.au/job/")) return true;
  // LinkedIn individual listing: /jobs/view/1234567890
  if (url.includes("linkedin.com/jobs/view/")) return true;
  // Indeed individual listing: ?vjk= or /viewjob? or /rc/clk? or /company/.../jobs/...?
  if (url.includes("indeed.com") && (url.includes("vjk=") || url.includes("/viewjob?") || url.includes("/rc/clk?"))) return true;
  // Jora individual listing: /job/...-... (has a hash-like ID)
  if (url.includes("jora.com/job/")) return true;
  // EthicalJobs individual listing
  if (url.includes("ethicaljobs.com.au/") && url.match(/\/\d{5,}/)) return true;
  // Workforce Australia individual listing
  if (url.includes("workforceaustralia.gov.au/") && url.includes("/job/")) return true;
  // Government career sites (individual listing usually has /job/ or /details/)
  if ((url.includes("careers.") || url.includes("iworkfor.") || url.includes("smartjobs.")) &&
      (url.includes("/job/") || url.includes("/details/") || url.includes("/position/"))) return true;
  // Company career pages with specific job ID patterns
  if (url.includes("/job/") && url.match(/\/\d{4,}/)) return true;
  if (url.includes("careers.") && url.match(/\/\d{4,}/)) return true;
  // Glassdoor individual listing: /job-listing/... or /Job/...-J12345678 (with J-number ID)
  if (url.includes("glassdoor") && (url.includes("/job-listing/") || url.match(/-J\d{5,}/))) return true;
  // SimplyHired individual listing
  if (url.includes("simplyhired") && url.includes("/job/")) return true;

  return false;
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

function decodeUrl(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function parseResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // DDG lite: organic results are <a rel="nofollow" href="//duckduckgo.com/l/?uddg=...">
  // (they do NOT have class="result-link" — only ads have that class)
  const linkRegex = /<a[^>]*href=['"]([^"']*uddg=[^"']+)['"][^>]*>([^<]+)<\/a>/g;

  const links: { title: string; url: string }[] = [];
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    let href = linkMatch[1].replace(/&amp;/g, "&");
    const title = linkMatch[2].replace(/<[^>]+>/g, "").trim();

    // Extract uddg parameter
    let encodedUrl = "";
    if (href.includes("uddg=")) {
      const uddgPart = href.split("uddg=")[1];
      // Remove trailing DuckDuckGo params (rut=...)
      encodedUrl = uddgPart.split("&rut=")[0];
    }
    if (!encodedUrl) continue;

    const url = decodeUrl(encodedUrl);
    // Skip ads
    if (url.includes("bing.com") || url.includes("duckduckgo.com/y.js")) continue;
    links.push({ title, url });
  }

  // Extract snippets
  const snippets: string[] = [];
  const snippetRegex = /<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/g;
  let snippetMatch;
  while ((snippetMatch = snippetRegex.exec(html)) !== null) {
    snippets.push(snippetMatch[1].replace(/<[^>]+>/g, "").trim());
  }

  for (let i = 0; i < links.length; i++) {
    results.push({
      title: links[i].title,
      url: links[i].url,
      snippet: snippets[i] || "",
    });
  }

  return results;
}

export async function searchDuckDuckGoJobs(
  input: DuckDuckGoInput
): Promise<StructuredJob[] | null> {
  const limit = Math.min(input.limit || 8, 10);

  // One broad query — DuckDuckGo returns diverse results we filter by domain
  const queries = [
    `${input.keywords} job ${input.location} ${input.country}`,
  ];

  const allResults: SearchResult[] = [];

  for (const query of queries.slice(0, 2)) {
    // limit to 2 queries to stay fast
    try {
      const url = new URL(DDG_LITE);
      url.searchParams.set("q", query);
      url.searchParams.set("kl", input.country === "Australia" ? "au-en" : "");

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        console.error("DuckDuckGo error:", response.status);
        continue;
      }

      const html = await response.text();
      const parsed = parseResults(html);
      allResults.push(...parsed);
    } catch (err) {
      console.error("DuckDuckGo search failed:", err);
      continue;
    }
  }

  if (allResults.length === 0) return null;

  // Filter for job-related URLs and deduplicate
  const seen = new Set<string>();
  const jobResults = allResults.filter((r) => {
    if (!isIndividualJobUrl(r.url)) return false;
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  if (jobResults.length === 0) return null;

  return jobResults.slice(0, limit).map((r) => ({
    title: r.title.split(" - ")[0]?.split(" | ")[0]?.trim() || r.title,
    company: r.title.split(" - ")[1]?.split(" | ")[0]?.trim() || "See listing",
    location: input.location,
    directUrl: r.url,
    description: r.snippet || "",
    salary: "See listing",
    experienceRequirements: "See listing",
    skillsRequired: [],
    employmentType: "See listing",
    source: inferSource(r.url),
    postedDate: "Recently",
  }));
}
