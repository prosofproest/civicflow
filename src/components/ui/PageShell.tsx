import React from "react";
import Link from "next/link";
import { ShieldCheck, Layers, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  hideNav?: boolean;
}

export const PageShell: React.FC<PageShellProps> = ({
  children,
  className,
  hideNav = false,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      {!hideNav && (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2.5 font-bold text-slate-900 tracking-tight hover:opacity-90 transition-opacity"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold leading-tight text-slate-900">
                    {siteConfig.name}
                  </span>
                  <span className="text-xs text-slate-500 font-normal leading-none">
                    {siteConfig.tagline}
                  </span>
                </div>
              </Link>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/design"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Design System</span>
              </Link>
              <span className="ml-2 hidden sm:inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                Phase 0
              </span>
            </nav>
          </div>
        </header>
      )}

      <main className={cn("flex-1", className)}>{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50 py-8 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{siteConfig.name}</span>
              <span>—</span>
              <span>{siteConfig.tagline}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-center sm:text-right">
              <span className="text-slate-500">
                Sample data used for illustrative previews.
              </span>
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

PageShell.displayName = "PageShell";
