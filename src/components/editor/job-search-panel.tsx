"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  MapPin,
  Building2,
  ExternalLink,
  ChevronDown,
  Briefcase,
  Globe,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";

interface JobListing {
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
  postedDate?: string;
}

interface JobSearchPanelProps {
  onSelectJob: (description: string, title: string) => void;
}

export function JobSearchPanel({ onSelectJob }: JobSearchPanelProps) {
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("Australia");
  const [experienceYears, setExperienceYears] = useState("");
  const [results, setResults] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchNote, setSearchNote] = useState("");
  const [dataSource, setDataSource] = useState<"live" | "ai-fallback" | null>(
    null
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!keywords.trim() || !location.trim() || !country.trim()) return;
    setLoading(true);
    setError(null);
    setExpandedId(null);

    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: keywords.trim(),
          location: location.trim(),
          country: country.trim(),
          experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResults(json.data.jobs);
      setSearchNote(json.data.searchNote);
      setDataSource(json.data.dataSource || "ai-fallback");
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Search failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search bar — row 1: keywords + location + country */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Job title or keywords..."
            className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="relative flex-1 sm:max-w-[200px]">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="City or region..."
            className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="relative sm:max-w-[160px]">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Country..."
            className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
      {/* Search bar — row 2: experience + search button */}
      <div className="flex items-center gap-2">
        <div className="relative w-44">
          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="number"
            min="0"
            max="30"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. 7"
            className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <p className="text-muted-foreground text-xs">years of my experience</p>
        <div className="flex-1" />
        <Button
          onClick={handleSearch}
          disabled={loading || !keywords.trim() || !location.trim() || !country.trim()}
          size="lg"
          className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-600 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {searched && results.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center text-muted-foreground text-sm"
          >
            No jobs found. Try different keywords or location.
          </motion.div>
        )}

        {results.length > 0 && (
          <div
            className={`flex items-start gap-2 rounded-xl border p-3 ${
              dataSource === "live"
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-950/20"
                : "border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-950/20"
            }`}
          >
            <Info
              className={`h-4 w-4 shrink-0 mt-0.5 ${
                dataSource === "live"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            />
            <div
              className={`text-xs ${
                dataSource === "live"
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {dataSource === "live" ? (
                <>
                  <p className="font-medium mb-0.5">Live Job Listings</p>
                  <p>
                    These listings are fetched from real job platforms. Click
                    &ldquo;View Job Posting&rdquo; to see the full listing on the
                    original site.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium mb-0.5">AI-Synthesised Listings</p>
                  <p>
                    Descriptions are AI-generated based on real market patterns.
                    Click &ldquo;View Job Posting&rdquo; to search for similar roles
                    on job platforms.
                  </p>
                </>
              )}
              {searchNote && (
                <span className="block mt-1 opacity-80">{searchNote}</span>
              )}
            </div>
          </div>
        )}

        {results.map((job, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard
              className="cursor-pointer transition-all hover:border-primary/30"
              onClick={() =>
                setExpandedId(expandedId === i ? null : i)
              }
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{job.title}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      {job.postedDate && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {job.postedDate}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {job.source}
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                      expandedId === i ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {expandedId === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
                        {/* Structured fields */}
                        <div className="grid gap-2 sm:grid-cols-2">
                          {job.salary && (
                            <div className="flex items-start gap-2 rounded-lg bg-accent/5 p-2.5">
                              <span className="mt-0.5 shrink-0 text-sm">💰</span>
                              <div>
                                <p className="font-medium text-xs">Salary</p>
                                <p className="text-muted-foreground text-xs">{job.salary}</p>
                              </div>
                            </div>
                          )}
                          {job.experienceRequirements && (
                            <div className="flex items-start gap-2 rounded-lg bg-accent/5 p-2.5">
                              <span className="mt-0.5 shrink-0 text-sm">📋</span>
                              <div>
                                <p className="font-medium text-xs">Experience</p>
                                <p className="text-muted-foreground text-xs">{job.experienceRequirements}</p>
                              </div>
                            </div>
                          )}
                          {job.employmentType && (
                            <div className="flex items-start gap-2 rounded-lg bg-accent/5 p-2.5">
                              <span className="mt-0.5 shrink-0 text-sm">⏱</span>
                              <div>
                                <p className="font-medium text-xs">Type</p>
                                <p className="text-muted-foreground text-xs">{job.employmentType}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {job.skillsRequired && job.skillsRequired.length > 0 && (
                          <div>
                            <p className="mb-1.5 font-medium text-xs">Skills Required</p>
                            <div className="flex flex-wrap gap-1">
                              {job.skillsRequired.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {job.description && (
                          <p className="text-muted-foreground text-xs leading-relaxed border-t border-border/40 pt-2">
                            {job.description}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectJob(job.description, job.title);
                            }}
                            className="gap-1.5"
                          >
                            Use this JD
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={job.directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View Job Posting
                            </a>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
