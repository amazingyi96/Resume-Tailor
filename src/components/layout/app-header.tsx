"use client";

import Link from "next/link";
import { History, Briefcase } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { APP_NAME } from "@/lib/constants";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground text-sm font-bold shadow-md shadow-primary/25">
            RT
          </div>
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/history">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </button>
          </Link>
          <Link href="/tracker">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Tracker</span>
            </button>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
