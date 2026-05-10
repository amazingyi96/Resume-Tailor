import { APP_NAME } from "@/lib/constants";

export function AppFooter() {
  return (
    <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4">
        {APP_NAME} &mdash; AI-powered resume tailoring. Your data is processed
        securely and never stored on our servers.
      </div>
    </footer>
  );
}
