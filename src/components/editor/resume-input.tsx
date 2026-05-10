"use client";

import { Textarea } from "@/components/ui/textarea";
import { ResumeUploader } from "./resume-uploader";
import { MAX_RESUME_LENGTH } from "@/lib/constants";

interface ResumeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ResumeInput({
  value,
  onChange,
  disabled,
}: ResumeInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-medium text-sm">Your Resume</label>
        <span className="text-muted-foreground text-xs">
          {value.length}/{MAX_RESUME_LENGTH}
        </span>
      </div>
      <ResumeUploader
        onTextExtracted={onChange}
        disabled={disabled}
      />
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_RESUME_LENGTH))}
        placeholder="Paste your current resume here, or upload a file above..."
        className="min-h-[200px] resize-y font-mono text-xs leading-relaxed"
        disabled={disabled}
      />
    </div>
  );
}
