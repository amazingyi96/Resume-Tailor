"use client";

import { Textarea } from "@/components/ui/textarea";
import { JdUrlInput } from "./jd-url-input";
import { MAX_JD_LENGTH } from "@/lib/constants";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function JobDescriptionInput({
  value,
  onChange,
  disabled,
}: JobDescriptionInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-medium text-sm">Job Description</label>
        <span className="text-muted-foreground text-xs">
          {value.length}/{MAX_JD_LENGTH}
        </span>
      </div>
      <JdUrlInput onFetched={onChange} disabled={disabled} />
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_JD_LENGTH))}
        placeholder="Paste the full job description here, or use the URL fetch above..."
        className="min-h-[180px] resize-y font-mono text-xs leading-relaxed"
        disabled={disabled}
      />
    </div>
  );
}
