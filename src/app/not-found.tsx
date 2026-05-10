import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="mb-2 font-bold text-6xl text-muted-foreground/30">404</h1>
      <p className="mb-6 text-muted-foreground">This page does not exist.</p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to ResumeTailor
      </Link>
    </div>
  );
}
