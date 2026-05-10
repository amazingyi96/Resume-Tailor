"use client";

import { useState } from "react";
import { FileDown, FileText, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPdf, downloadPdf } from "@/lib/export-pdf";
import { exportToDocx, downloadDocx } from "@/lib/export-docx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface ExportBarProps {
  resumeText: string;
  title: string;
}

export function ExportBar({ resumeText, title }: ExportBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePdf = () => {
    const blob = exportToPdf(resumeText, title);
    downloadPdf(blob, title.replace(/\s+/g, "-").toLowerCase());
  };

  const handleDocx = async () => {
    const blob = await exportToDocx(resumeText, title);
    downloadDocx(blob, title.replace(/\s+/g, "-").toLowerCase());
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        <span className="mr-2 text-muted-foreground text-xs">Export:</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handlePdf}>
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
              PDF
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download as PDF</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleDocx}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              DOCX
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download as Word document</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="mr-1.5 h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy to clipboard</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
