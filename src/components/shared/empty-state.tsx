import { FileText, Search } from "lucide-react";

interface EmptyStateProps {
  type: "welcome" | "no-versions";
}

export function EmptyState({ type }: EmptyStateProps) {
  if (type === "welcome") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 font-semibold text-xl">Tailor Your Resume</h2>
        <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
          Paste a job description and your current resume. Our AI will analyze
          the match and rewrite your resume to maximize your chances of getting
          noticed.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Search className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 font-semibold text-xl">No Saved Versions</h2>
      <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
        Tailored resumes you save will appear here. Go back and tailor a resume
        to get started.
      </p>
    </div>
  );
}
