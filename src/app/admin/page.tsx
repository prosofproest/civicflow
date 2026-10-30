"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  LogOut,
  Mail,
  Calendar,
  Info,
  CheckCircle2,
  Lock,
  AlertTriangle,
  LogIn,
  BarChart3,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/auth-context";
import { ComplaintStats } from "@/lib/services/complaints";
import { CATEGORY_LABELS } from "@/lib/constants";
import { Category } from "@/types";

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/complaints/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json?.ok && json.data) {
          setStats(json.data);
        }
      })
      .catch((err) => console.error("Failed to load admin stats:", err))
      .finally(() => {
        if (isMounted) setIsStatsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isAdmin = user?.role === "admin";

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200 mb-1">
              <Lock className="h-3.5 w-3.5" />
              <span>Municipal Administrator Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Administrative Control Console
            </h1>
            <p className="text-sm text-slate-500">
              City-wide system authority, role governance, and audit operations.
            </p>
          </div>

          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              isLoading={isLoading}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              Sign Out
            </Button>
          )}
        </div>

        {/* 1. Loading State */}
        {isLoading ? (
          <Card className="shadow-xs animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-48 bg-slate-200 rounded" />
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
                <span>Verifying administrative credentials...</span>
              </div>
            </CardContent>
          </Card>
        ) : !isAdmin ? (
          /* 2. Unauthorized / Access Denied State */
          <Card className="border-rose-200 bg-rose-50/40 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Administrator Access Required
                  </CardTitle>
                  <CardDescription className="text-rose-700">
                    {user
                      ? `Your current session role (${user.role}) is not authorized for administrative governance.`
                      : "No active municipal administrator session was detected."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              <p className="text-xs text-slate-700 leading-relaxed">
                Access to the Administrative Control Console requires verified administrator privileges. If you are a municipal system director, please log in with your administrative credentials.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/login?redirect=/admin">
                  <Button variant="primary" size="md" leftIcon={<LogIn className="h-4 w-4" />}>
                    Sign In as Administrator
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" size="md">
                    Return to Overview
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* 3. Verified Administrator Console */
          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-lg border border-rose-200">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl truncate">
                      {user.displayName || "Municipal Administrator"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="critical" size="md" showDot className="shrink-0">
                  Admin
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 font-medium">RBAC Level</span>
                  <p className="text-sm font-bold text-slate-800">
                    Administrator (Verified)
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 font-medium">Console Privileges</span>
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Cross-Departmental Oversight</span>
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 font-medium">Session Initialized</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Active Session"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-xs text-rose-950 flex items-start gap-3">
                <Info className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0 flex-1 break-words">
                  <span className="font-semibold block">Municipal System Governance</span>
                  <p className="text-rose-800 leading-relaxed">
                    Provides administrative audit visibility, field officer workflow inspection, cross-departmental complaint monitoring, and priority rule oversight.
                  </p>
                </div>
              </div>

              {/* Operational Metrics: Sourced from Live Data */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span>Live Operational Metrics (Available System Data)</span>
                  </span>
                  {isStatsLoading && (
                    <span className="text-[10px] text-slate-400">Updating metrics...</span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Recorded</span>
                    <span className="text-xl font-bold text-slate-800">
                      {isStatsLoading ? "—" : stats?.total ?? 0}
                    </span>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-3 border border-rose-200 text-center">
                    <span className="text-[10px] text-rose-600 font-semibold block uppercase">Critical / High</span>
                    <span className="text-xl font-bold text-rose-700">
                      {isStatsLoading ? "—" : (stats?.critical ?? 0) + (stats?.high ?? 0)}
                    </span>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 border border-blue-200 text-center">
                    <span className="text-[10px] text-blue-700 font-semibold block uppercase">Active In-Flight</span>
                    <span className="text-xl font-bold text-blue-800">
                      {isStatsLoading ? "—" : stats?.open ?? 0}
                    </span>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Resolved Cases</span>
                    <span className="text-xl font-bold text-emerald-800">
                      {isStatsLoading ? "—" : stats?.resolved ?? 0}
                    </span>
                  </div>
                </div>

                {stats?.byCategory && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 mt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
                      Incidents by Category (Live Database)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {(Object.entries(stats.byCategory) as [Category, number][]).map(([cat, count]) => (
                        <div key={cat} className="bg-white p-2 rounded border border-slate-200 text-center">
                          <span className="text-[10px] text-slate-500 block truncate">
                            {CATEGORY_LABELS[cat] || cat}
                          </span>
                          <span className="font-bold text-slate-800">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/officer">
                  <Button variant="outline" size="sm">
                    Inspect Officer Desk
                  </Button>
                </Link>
                <Link href="/citizen">
                  <Button variant="outline" size="sm">
                    Inspect Citizen Portal
                  </Button>
                </Link>
                <Link href="/citizen/complaints">
                  <Button variant="outline" size="sm">
                    Audit Complaint Records
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
