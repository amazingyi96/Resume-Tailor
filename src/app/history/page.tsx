"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { VersionList } from "@/components/history/version-list";
import { GlassCard } from "@/components/shared/glass-card";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Button } from "@/components/ui/button";
import { useVersionHistory } from "@/hooks/use-version-history";

export default function HistoryPage() {
  const { versions, deleteVersion, clearAll } = useVersionHistory();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <ErrorBoundary>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="font-semibold text-xl">Version History</h1>
          </div>
          {versions.length > 0 && (
            <div>
              {!showClearConfirm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Clear All
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Clear all {versions.length} versions?
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      clearAll();
                      setShowClearConfirm(false);
                    }}
                  >
                    Yes, clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <GlassCard>
          <div className="p-5">
            <VersionList versions={versions} onDelete={deleteVersion} />
          </div>
        </GlassCard>
      </div>
    </ErrorBoundary>
  );
}
