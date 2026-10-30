"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Layers, ExternalLink, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth/auth-context";

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
  const { user, logout } = useAuth();

  const getPortalLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "officer") return "/officer";
    return "/citizen";
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 overflow-x-hidden">
      {!hideNav && (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-slate-900 tracking-tight hover:opacity-90 transition-opacity"
              >
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base font-semibold leading-tight text-slate-900">
                    {siteConfig.name}
                  </span>
                  <span className="hidden xs:inline text-[10px] sm:text-xs text-slate-500 font-normal leading-none">
                    {siteConfig.tagline}
                  </span>
                </div>
              </Link>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link
                href="/"
                className="hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/design"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Design System</span>
              </Link>

              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href={getPortalLink()}
                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="capitalize">{user.role} Desk</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/login"
                    className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs"
                  >
                    Register
                  </Link>
                </div>
              )}

              <span className="ml-1 sm:ml-2 hidden lg:inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                Phase 1
              </span>
            </nav>
          </div>
        </header>
      )}

      <main className={cn("flex-1 overflow-x-hidden", className)}>{children}</main>

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
