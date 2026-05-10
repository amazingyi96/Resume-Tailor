"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trash2, Eye, Calendar, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TONE_OPTIONS } from "@/lib/constants";
import type { Version } from "@/lib/types";

interface VersionCardProps {
  version: Version;
  onDelete: (id: string) => void;
}

export function VersionCard({ version, onDelete }: VersionCardProps) {
  const toneLabel =
    TONE_OPTIONS.find((t) => t.value === version.tone)?.label ??
    version.tone;

  const date = new Date(version.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group rounded-xl border border-border/40 bg-card/60 backdrop-blur-xl p-5 transition-all hover:border-border/80 hover:shadow-lg"
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold text-sm leading-snug">{version.title}</h3>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs font-medium">
          {toneLabel}
        </span>
      </div>
      <div className="mb-3 flex items-center gap-3 text-muted-foreground text-xs">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {date}
        </span>
        <span className="flex items-center gap-1">
          <Gauge className="h-3 w-3" />
          ATS Score: {version.analysis.atsScore}
        </span>
      </div>
      <div className="flex gap-2">
        <Link href={`/history/${version.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(version.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
