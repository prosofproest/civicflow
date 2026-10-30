"use client";

import React from "react";
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
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

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

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            isLoading={isLoading}
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
          >
            Sign Out
          </Button>
        </div>

        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-lg border border-rose-200">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl truncate">
                    Administrator {user?.displayName || "System Admin"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-0.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user?.email || "admin@civicflow.gov"}</span>
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
                  Root Administrator (Tier 1)
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                <span className="text-slate-400 font-medium">Console Privileges</span>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Full Municipal Authority</span>
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                <span className="text-slate-400 font-medium">Session Initialized</span>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Today"}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-xs text-rose-950 flex items-start gap-3">
              <Info className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0 flex-1 break-words">
                <span className="font-semibold block">Administrative Governance Console</span>
                <p className="text-rose-800 leading-relaxed">
                  Full municipal administrator authority active. You have oversight across all citizen submissions, deterministic priority calculations, geospatial duplicate groups, and field officer assignments.
                </p>
              </div>
            </div>

            {/* Quick Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Total Records</span>
                <span className="text-xl font-bold text-slate-800">45+</span>
              </div>
              <div className="rounded-lg bg-rose-50 p-3 border border-rose-200 text-center">
                <span className="text-[10px] text-rose-600 font-semibold block uppercase">Hazards Active</span>
                <span className="text-xl font-bold text-rose-700">4</span>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-center">
                <span className="text-[10px] text-amber-700 font-semibold block uppercase">Duplicate Pairs</span>
                <span className="text-xl font-bold text-amber-800">3</span>
              </div>
              <div className="rounded-lg bg-cyan-50 p-3 border border-cyan-200 text-center">
                <span className="text-[10px] text-cyan-700 font-semibold block uppercase">Hotspot Clusters</span>
                <span className="text-xl font-bold text-cyan-800">1</span>
              </div>
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
      </div>
    </PageShell>
  );
}
