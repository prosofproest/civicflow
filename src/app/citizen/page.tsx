"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  LogOut,
  Mail,
  Calendar,
  Shield,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/auth-context";

export default function CitizenPortalPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 mb-1">
              <Shield className="h-3.5 w-3.5" />
              <span>Phase 1 — Citizen Role Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Citizen Workspace
            </h1>
            <p className="text-sm text-slate-500">
              Welcome to your personal CivicFlow municipal engagement space.
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

        {/* User Profile Card */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-200">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl truncate">
                    {user?.displayName || "Authenticated Citizen"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-0.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user?.email || "Resolving session email..."}</span>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="primary" size="md" showDot className="shrink-0">
                Citizen
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                <span className="text-slate-400 font-medium">Assigned Role</span>
                <p className="text-sm font-bold text-slate-800 capitalize">
                  {user?.role || "citizen"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                <span className="text-slate-400 font-medium">Account Status</span>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{user?.active ? "Active" : "Pending"}</span>
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                <span className="text-slate-400 font-medium">Member Since</span>
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

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0 flex-1 break-words">
                <span className="font-semibold block">Phase 1 Scope Notice</span>
                <p className="text-blue-700 leading-relaxed">
                  Authentication, session cookies, and role enforcement are active. In accordance with the hackathon roadmap, citizen complaint intake, GPS location pinning, and photo evidence uploads belong strictly to Phase 2.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/design">
                <Button variant="outline" size="sm" leftIcon={<Layers className="h-3.5 w-3.5" />}>
                  Explore Design Showcase
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Return to Overview
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
