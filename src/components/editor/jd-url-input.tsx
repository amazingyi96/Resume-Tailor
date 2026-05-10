"use client";

import { useState } from "react";
import { Link, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JdUrlInputProps {
  onFetched: (text: string) => void;
  disabled?: boolean;
}

export function JdUrlInput({ onFetched, disabled }: JdUrlInputProps) {
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setError(null);
    setFetching(true);

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch-url", url: trimmed }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Failed to fetch URL");
      }

      onFetched((json as { data: { text: string } }).data.text);
      setUrl("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch job description"
      );
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFetch();
            }}
            placeholder="Paste job listing URL to auto-extract..."
            disabled={disabled || fetching}
            className={cn(
              "flex h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3",
              "text-sm shadow-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFetch}
          disabled={disabled || fetching || !url.trim()}
          className="shrink-0"
        >
          {fetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Fetch"
          )}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
