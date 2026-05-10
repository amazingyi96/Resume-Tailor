"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MissingSkillsListProps {
  skills: string[];
}

export function MissingSkillsList({ skills }: MissingSkillsListProps) {
  if (skills.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="font-medium text-sm">Missing Keywords &amp; Skills</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, i) => (
          <motion.div
            key={skill}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Badge variant="secondary" className="text-xs">
              {skill}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
