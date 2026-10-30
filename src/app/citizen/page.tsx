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
  ArrowRight,
  Info,
  FileText,
  AlertTriangle,
  LogIn,
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
              <span>Citizen Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Citizen Workspace
            </h1>
            <p className="text-sm text-slate-500">
              Welcome to your personal CivicFlow municipal engagement space.
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
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Verifying authenticated municipal session...</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="h-16 bg-slate-100 rounded-lg" />
                <div className="h-16 bg-slate-100 rounded-lg" />
                <div className="h-16 bg-slate-100 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ) : !user ? (
          /* 2. Unauthenticated / Session Resolution Error State */
          <Card className="border-amber-200 bg-amber-50/30 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Authentication Required
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    No active citizen session was detected.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              <p className="text-xs text-slate-700 leading-relaxed">
                You must be signed in to access your personal citizen workspace, submit municipal complaints, and track real-time resolution updates.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/login?redirect=/citizen">
                  <Button variant="primary" size="md" leftIcon={<LogIn className="h-4 w-4" />}>
                    Sign In to Citizen Portal
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
          /* 3. Authenticated Real User Profile Card */
          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-200">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl truncate">
                      {user.displayName || user.email}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="primary" size="md" showDot className="shrink-0 capitalize">
                  {user.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 font-medium">Assigned Role</span>
                  <p className="text-sm font-bold text-slate-800 capitalize">
                    {user.role}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 font-medium">Account Status</span>
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{user.active ? "Active" : "Pending"}</span>
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/70 space-y-1">
                  <span className="text-slate-400 font-medium">Member Since</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Verified Account"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link href="/citizen/submit">
                  <Button variant="primary" className="w-full justify-start p-4 h-auto" leftIcon={<FileText className="h-5 w-5" />}>
                    <div className="text-left">
                      <span className="font-bold block text-sm">Report a Civic Issue</span>
                      <span className="text-xs font-normal opacity-90 block">File waterlogging, road damage, or hazards</span>
                    </div>
                  </Button>
                </Link>
                <Link href="/citizen/complaints">
                  <Button variant="outline" className="w-full justify-start p-4 h-auto" leftIcon={<Calendar className="h-5 w-5 text-blue-600" />}>
                    <div className="text-left">
                      <span className="font-bold block text-sm">Track My Complaints</span>
                      <span className="text-xs font-normal text-slate-500 block">View AI triage, priority, and progress</span>
                    </div>
                  </Button>
                </Link>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0 flex-1 break-words">
                  <span className="font-semibold block">Intelligent Municipal Intake</span>
                  <p className="text-blue-700 leading-relaxed">
                    File civic issues with automated GPS detection, monitor AI category extraction, and track explainable priority scores as municipal officers act on your submissions.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    Return to Overview
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
