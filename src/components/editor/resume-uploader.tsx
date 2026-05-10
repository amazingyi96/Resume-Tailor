"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeUploaderProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export function ResumeUploader({
  onTextExtracted,
  disabled,
}: ResumeUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setParsing(true);
      setError(null);

      try {
        const ext = file.name.split(".").pop()?.toLowerCase();
        let text = "";

        if (ext === "pdf") {
          const arrayBuffer = await file.arrayBuffer();
          const pdfjsLib = await import("pdfjs-dist");

          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          const pages: string[] = [];

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" ");
            pages.push(pageText);
          }

          text = pages.join("\n\n");
        } else if (ext === "docx") {
          const arrayBuffer = await file.arrayBuffer();
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else if (ext === "doc") {
          throw new Error(
            "Old .doc format is not supported. Please save as .docx or PDF."
          );
        } else if (ext === "txt") {
          text = await file.text();
        } else {
          throw new Error(
            `Unsupported file type: .${ext}. Please use PDF, DOCX, or TXT.`
          );
        }

        if (!text.trim()) {
          throw new Error("No readable text found in the file.");
        }

        onTextExtracted(text.trim());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse file"
        );
      } finally {
        setParsing(false);
      }
    },
    [onTextExtracted]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleClear = () => {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {!fileName ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors",
            dragOver
              ? "border-primary/50 bg-primary/5"
              : "border-border/60 hover:border-primary/30 hover:bg-primary/5",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-sm">
              Drop your resume here or click to browse
            </p>
            <p className="text-muted-foreground text-xs">
              PDF, DOCX, or TXT (max 10MB)
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      ) : parsing ? (
        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="font-medium text-sm">Parsing {fileName}...</p>
            <p className="text-muted-foreground text-xs">
              Extracting text from file
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-950/20">
          <div className="flex-1">
            <p className="font-medium text-red-600 dark:text-red-400 text-sm">
              Failed to parse {fileName}
            </p>
            <p className="text-red-500 dark:text-red-300 text-xs">{error}</p>
          </div>
          <button
            onClick={handleClear}
            className="shrink-0 rounded p-0.5 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* File loaded badge */}
      {fileName && !error && !parsing && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-800/30 dark:bg-emerald-950/20">
          <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="flex-1 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            {fileName}
          </span>
          <span className="text-emerald-500 text-xs">extracted</span>
          <button
            onClick={handleClear}
            className="rounded text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
