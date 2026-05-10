"use client";

import { AnimatePresence } from "framer-motion";
import { VersionCard } from "./version-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { Version } from "@/lib/types";

interface VersionListProps {
  versions: Version[];
  onDelete: (id: string) => void;
}

export function VersionList({ versions, onDelete }: VersionListProps) {
  if (versions.length === 0) {
    return <EmptyState type="no-versions" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {versions.map((version) => (
          <VersionCard
            key={version.id}
            version={version}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
