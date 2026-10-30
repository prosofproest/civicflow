"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  MapPin,
  Calendar,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { Complaint, Status } from "@/types";

export default function CitizenComplaintsHistoryPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/complaints?reporterOnly=true");
      const data = await res.json();
      if (data.ok && Array.isArray(data.data)) {
        setComplaints(data.data);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/complaints?reporterOnly=true")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.ok && Array.isArray(data.data)) {
          setComplaints(data.data);
        }
      })
      .catch((err) => console.error("Failed to load complaints:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const matchesCat = selectedCategory === "all" || c.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.summary && c.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
              <FileText className="h-3.5 w-3.5" />
              <span>Citizen Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Complaint History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Track the progress, AI assessment, and departmental actions on your submitted tickets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchComplaints}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Refresh
            </Button>
            <Link href="/citizen/submit">
              <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                File New Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket ID or description keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Complaints Listing */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-xs text-slate-500">Loading your civic reports...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed py-14 text-center">
            <CardContent className="space-y-4">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No Complaints Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== "all"
                    ? "No tickets match your active filter criteria."
                    : "You haven't submitted any civic complaints yet. Help improve your city by filing your first report."}
                </p>
              </div>
              <Link href="/citizen/submit">
                <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                  File a Civic Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const isExpanded = expandedId === item.id;
              const hasDuplicate = Boolean(item.duplicate?.ofId);

              return (
                <Card
                  key={item.id}
                  className={`transition-all ${
                    isExpanded ? "border-blue-300 shadow-xs" : "hover:border-slate-300"
                  }`}
                >
                  <CardHeader className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            #{item.id}
                          </span>
                          <Badge variant="neutral" size="sm">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </Badge>
                          <Badge
                            variant={
                              item.status === "resolved"
                                ? "resolved"
                                : item.status === "in_progress"
                                ? "in_progress"
                                : item.status === "assigned"
                                ? "assigned"
                                : "submitted"
                            }
                            size="sm"
                            showDot
                          >
                            {STATUS_LABELS[item.status as Status] || item.status}
                          </Badge>

                          {hasDuplicate && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Duplicate Flagged</span>
                            </span>
                          )}

                          {item.isSynthetic && (
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              Demo Data
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate pt-0.5">
                          {item.summary || item.text}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location.address || `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`}
                          </span>
                          {item.assignedTo && (
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <UserCheck className="h-3 w-3 text-blue-600" />
                              Assigned: {item.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Priority Score Indicator & Toggle */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right">
                          <Badge
                            variant={
                              item.priority.level === "critical"
                                ? "critical"
                                : item.priority.level === "high"
                                ? "high"
                                : item.priority.level === "medium"
                                ? "medium"
                                : "low"
                            }
                            size="sm"
                            showDot
                          >
                            {item.priority.score}/100 — {item.priority.level.toUpperCase()}
                          </Badge>
                        </div>

                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          aria-label={isExpanded ? "Collapse ticket" : "Expand ticket details"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Expanded Detailed Breakdown */}
                  {isExpanded && (
                    <CardContent className="border-t border-slate-100 pt-4 pb-4 space-y-4 text-xs bg-slate-50/50">
                      <div>
                        <span className="font-semibold text-slate-700 block mb-1">
                          Full Citizen Report Text:
                        </span>
                        <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                          {item.text}
                        </p>
                      </div>

                      {/* Explainable Factor Breakdown */}
                      <div className="space-y-1.5">
                        <span className="font-semibold text-slate-700 block">
                          Priority Factor Breakdown (Deterministic Engine):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {item.priority.factors.map((f) => (
                            <div key={f.key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {f.label} ({Math.round(f.weight * 100)}%)
                              </span>
                              <span className="font-bold text-slate-800 text-xs">
                                {f.input}/100
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Contrib: +{f.contribution}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                          {item.priority.explanation}
                        </p>
                      </div>

                      {/* Duplicate Correlation Status */}
                      {hasDuplicate && (
                        <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-amber-900 space-y-1">
                          <span className="font-semibold flex items-center gap-1.5 text-xs text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            Potential Duplicate Reference: #{item.duplicate.ofId}
                          </span>
                          <ul className="list-disc list-inside text-[11px] text-amber-700 space-y-0.5">
                            {item.duplicate.reasons.map((r, idx) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Official Resolution Notes */}
                      {item.resolutionNotes && (
                        <div className="rounded-lg bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-950 space-y-1.5">
                          <span className="font-semibold flex items-center gap-1.5 text-xs text-emerald-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Official Municipal Resolution Note:
                          </span>
                          <p className="text-xs text-emerald-900 leading-relaxed bg-white/90 p-2.5 rounded-md border border-emerald-100 font-medium">
                            {item.resolutionNotes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
