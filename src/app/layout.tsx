import type { Metadata } from "next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s — ${APP_NAME}`,
  },
  description:
    "AI-powered resume tailoring. Paste a job description and automatically optimize your resume for ATS systems and recruiter expectations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
            <AppFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
