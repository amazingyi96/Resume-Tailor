"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TONE_OPTIONS } from "@/lib/constants";
import type { ToneStyle } from "@/lib/types";

interface ToneSelectorProps {
  value: ToneStyle;
  onChange: (value: ToneStyle) => void;
  disabled?: boolean;
}

export function ToneSelector({
  value,
  onChange,
  disabled,
}: ToneSelectorProps) {
  const selected = TONE_OPTIONS.find((t) => t.value === value);

  return (
    <Select value={value} onValueChange={onChange as (v: string) => void} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.label}
              <span className="text-muted-foreground font-normal">
                &mdash; {selected.description}
              </span>
            </span>
          ) : (
            "Select tone..."
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TONE_OPTIONS.map((tone) => (
          <SelectItem key={tone.value} value={tone.value}>
            <div className="flex flex-col">
              <span className="font-medium">{tone.label}</span>
              <span className="text-muted-foreground text-xs">
                {tone.description}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
