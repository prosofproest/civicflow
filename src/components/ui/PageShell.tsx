"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ExternalLink, LogOut, User as UserIcon } from "lucide-react";
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
  const router = useRouter();
  const { user, logout, switchDemoRole } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  const getPortalLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "officer") return "/officer";
    return "/citizen";
  };

  const isDemo = Boolean(user?.isDemo || user?.uid.startsWith("demo_"));
  const activeRole = user?.role || "citizen";

  const handleRoleSwitch = async (targetRole: "citizen" | "officer" | "admin") => {
    if (isSwitching) return;
    if (activeRole === targetRole) {
      if (targetRole === "admin") router.push("/admin");
      else if (targetRole === "officer") router.push("/officer");
      else router.push("/citizen");
      return;
    }

    setIsSwitching(true);
    try {
      await switchDemoRole(targetRole);
      if (targetRole === "admin") {
        router.push("/admin");
      } else if (targetRole === "officer") {
        router.push("/officer");
      } else {
        router.push("/citizen");
      }
    } catch (err) {
      console.error("Failed to switch demo role:", err);
    } finally {
      setIsSwitching(false);
    }
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
                className="hidden md:inline-flex px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                Overview
              </Link>

              <Link
                href="/demo"
                className="inline-flex px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-md transition-colors"
              >
                Demo Map
              </Link>

              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  {isDemo && (
                    <div
                      role="group"
                      aria-label="Demo Role Switcher"
                      className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs"
                    >
                      <button
                        type="button"
                        id="demo-switcher-citizen"
                        onClick={() => handleRoleSwitch("citizen")}
                        disabled={isSwitching}
                        className={cn(
                          "px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer text-[11px] sm:text-xs",
                          activeRole === "citizen"
                            ? "bg-white text-blue-700 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                        title="Switch to Demo Citizen Role"
                      >
                        Citizen
                      </button>
                      <button
                        type="button"
                        id="demo-switcher-officer"
                        onClick={() => handleRoleSwitch("officer")}
                        disabled={isSwitching}
                        className={cn(
                          "px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer text-[11px] sm:text-xs",
                          activeRole === "officer"
                            ? "bg-white text-blue-700 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                        title="Switch to Demo Officer Role"
                      >
                        Officer
                      </button>
                      <button
                        type="button"
                        id="demo-switcher-admin"
                        onClick={() => handleRoleSwitch("admin")}
                        disabled={isSwitching}
                        className={cn(
                          "px-2 sm:px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer text-[11px] sm:text-xs",
                          activeRole === "admin"
                            ? "bg-white text-blue-700 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                        title="Switch to Demo Administrator Role"
                      >
                        Admin
                      </button>
                    </div>
                  )}

                  <Link
                    href={getPortalLink()}
                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="capitalize">{user.role} Desk</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
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
                Municipal Issue Resolution & Priority Triaging
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
