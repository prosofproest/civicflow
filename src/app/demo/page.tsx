"use client";

import React, { useState, useMemo, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
import {
  ShieldAlert,
  Search,
  Filter,
  Layers,
  MapPin,
  AlertTriangle,
  FileText,
  Activity,
  SlidersHorizontal,
  ArrowRight,
  User,
  Shield,
  Eye,
  X,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SYNTHETIC_COMPLAINTS } from "@/lib/data/mock-complaints";
import { CATEGORIES, STATUSES } from "@/lib/constants";
import { Complaint, Category, Status, PriorityLevel } from "@/types";

const ComplaintMap = dynamic(() => import("@/components/map/ComplaintMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] w-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span>Loading spatial map view...</span>
      </div>
    </div>
  ),
});

const CATEGORY_LABELS: Record<Category, string> = {
  waterlogging: "Waterlogging",
  road_damage: "Road Damage",
  waste: "Waste & Garbage",
  streetlight: "Streetlights",
  drainage: "Storm Drainage",
  water_supply: "Water Supply",
  public_safety: "Public Safety",
  other: "Other Issues",
};

export default function DemoPage() {
  const router = useRouter();
  const [complaints] = useState<Complaint[]>(SYNTHETIC_COMPLAINTS);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const mounted = useMounted();

  useEffect(() => {
    if (!selectedComplaint) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedComplaint(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedComplaint]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  // Filtered dataset
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && c.priority?.level !== priorityFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = c.text.toLowerCase().includes(q);
        const matchSummary = c.summary?.toLowerCase().includes(q);
        const matchAddr = c.location.address?.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        if (!matchText && !matchSummary && !matchAddr && !matchId) return false;
      }

      return true;
    });
  }, [complaints, categoryFilter, priorityFilter, statusFilter, searchQuery]);

  // Aggregate stats
  const metrics = useMemo(() => {
    let critical = 0;
    let high = 0;
    let openCount = 0;
    let resolvedCount = 0;
    let duplicateCount = 0;

    for (const c of complaints) {
      if (c.priority?.level === "critical") critical++;
      if (c.priority?.level === "high") high++;
      if (c.status === "resolved") resolvedCount++;
      else openCount++;
      if (c.duplicate?.ofId) duplicateCount++;
    }

    return {
      total: complaints.length,
      critical,
      high,
      open: openCount,
      resolved: resolvedCount,
      duplicates: duplicateCount,
    };
  }, [complaints]);

  const selectComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Sample Data Banner */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Public Demonstration Environment — Sample Data</span>
              <p className="text-amber-800">
                You are viewing the 45 synthetic civic records modeled for the Astra Municipal District. This public view is read-only.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100">
                Switch Demo Role
              </Button>
            </Link>
          </div>
        </div>

        {/* Header Title & Role Shortcuts */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-2xs mb-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Astra Municipal District Demonstration</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Civic Operations & Spatial Reveal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Explore 45 multimodal complaints, deterministic priority scores, duplicate detection, and 250m transit hotspot clusters.
            </p>
          </div>

          {/* Quick Role Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 px-2 hidden sm:inline">Role Jump:</span>
            <button
              onClick={async () => {
                await fetch("/api/auth/demo", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ role: "citizen" }),
                });
                router.push("/citizen");
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-white transition-all"
            >
              <User className="h-3.5 w-3.5 text-blue-600" />
              <span>Citizen</span>
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth/demo", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ role: "officer" }),
                });
                router.push("/officer");
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-amber-700 hover:bg-white transition-all"
            >
              <Shield className="h-3.5 w-3.5 text-amber-600" />
              <span>Officer</span>
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth/demo", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ role: "admin" }),
                });
                router.push("/admin");
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-violet-700 hover:bg-white transition-all"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-violet-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Complaints</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{metrics.total}</p>
                <span className="text-[11px] text-slate-400">Synthetic dataset</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-100 bg-rose-50/20 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-rose-700 uppercase tracking-wider">Critical & High</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">{metrics.critical + metrics.high}</p>
                <span className="text-[11px] text-rose-600/80">{metrics.critical} critical hazards</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-amber-50/20 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Open Triage</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{metrics.open}</p>
                <span className="text-[11px] text-amber-600/80">Pending resolution</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/20 shadow-xs">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Verified Resolved</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{metrics.resolved}</p>
                <span className="text-[11px] text-emerald-600/80">With audit history</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Filter by Municipal Category ({complaints.length} Total)
            </span>
            {categoryFilter !== "all" && (
              <button
                onClick={() => setCategoryFilter("all")}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset Category Filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All Categories ({complaints.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = complaints.filter((c) => c.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    categoryFilter === cat
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {CATEGORY_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* View Toggle, Search, & Secondary Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description, address, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | "all")}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical (≥75)</option>
              <option value="high">High (≥55)</option>
              <option value="medium">Medium (≥35)</option>
              <option value="low">Low (&lt;35)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("map")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "map" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Reveal Map</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "table" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Table View ({filteredComplaints.length})</span>
            </button>
          </div>
        </div>

        {/* Main Content: Map or Table */}
        {viewMode === "map" ? (
          <div className="space-y-4">
            <Card className="overflow-hidden border-slate-200 shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800">
                    Astra Municipal Spatial Map ({filteredComplaints.length} reports rendered)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                    <span>Critical (≥75)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>High (≥55)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span>Medium (≥35)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                    <span>Low (&lt;35)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-purple-500 border-dashed" />
                    <span>250m Hotspot</span>
                  </div>
                </div>
              </div>
              <div className="p-0">
                <ComplaintMap
                  complaints={filteredComplaints}
                  selectedId={selectedComplaint?.id}
                  onSelectComplaint={selectComplaint}
                />
              </div>
            </Card>
          </div>
        ) : (
          <Card className="overflow-hidden border-slate-200 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Priority</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Assigned To</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No complaints match your selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                              c.priority?.level === "critical"
                                ? "bg-rose-100 text-rose-800"
                                : c.priority?.level === "high"
                                ? "bg-amber-100 text-amber-800"
                                : c.priority?.level === "medium"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {c.priority?.level || "low"} ({c.priority?.score || 0})
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                          {CATEGORY_LABELS[c.category]}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-700">
                          {c.summary || c.text}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {c.location.address || `${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)}`}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant={c.status === "resolved" ? "resolved" : "neutral"} size="sm">
                            {c.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {c.assignedTo || "Unassigned"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => selectComplaint(c)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Read-Only Slide-Over Complaint Inspection Drawer */}
        {mounted && selectedComplaint && createPortal(
          <div className="fixed inset-0 z-[99999] overflow-hidden">
            {/* Backdrop: Clicking closes drawer */}
            <div
              data-testid="drawer-backdrop"
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity z-[99999] cursor-pointer"
              onClick={() => setSelectedComplaint(null)}
              aria-hidden="true"
            />

            {/* Slide-over panel container: aligned to right, responsive full-width on mobile */}
            <div className="fixed inset-y-0 right-0 z-[100000] flex max-w-full pointer-events-none pl-0 sm:pl-10">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="demo-ticket-review-title"
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-screen max-w-full sm:max-w-md md:max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200"
              >
                <div className="sticky top-0 z-10 p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/95 backdrop-blur-xs">
                  <div className="flex items-center gap-2">
                    <span id="demo-ticket-review-title" className="font-mono text-xs font-semibold text-slate-500">
                      {selectedComplaint.id}
                    </span>
                    <Badge variant="primary" size="sm">
                      {CATEGORY_LABELS[selectedComplaint.category]}
                    </Badge>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    aria-label="Close complaint inspection drawer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6 flex-1">
                  {/* Priority Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      selectedComplaint.priority?.level === "critical"
                        ? "bg-rose-50 border-rose-200 text-rose-900"
                        : selectedComplaint.priority?.level === "high"
                        ? "bg-amber-50 border-amber-200 text-amber-900"
                        : selectedComplaint.priority?.level === "medium"
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <div>
                      <span className="text-xs uppercase font-bold tracking-wider">
                        Priority Level: {selectedComplaint.priority?.level.toUpperCase()}
                      </span>
                      <p className="text-xs mt-0.5 opacity-90">
                        Calculated deterministic score: {selectedComplaint.priority?.score}/100
                      </p>
                    </div>
                    <div className="text-2xl font-black">{selectedComplaint.priority?.score}</div>
                  </div>

                  {/* Complaint Summary */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Citizen Narrative
                    </span>
                    <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {selectedComplaint.text}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Geographic Coordinates
                    </span>
                    <p className="text-xs font-mono text-slate-700 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      <span>{selectedComplaint.location.address || "Astra Metropolitan Zone"}</span>
                      <span className="text-slate-400">
                        ({selectedComplaint.location.lat.toFixed(5)}, {selectedComplaint.location.lng.toFixed(5)})
                      </span>
                    </p>
                  </div>

                  {/* AI Triage Brief */}
                  {selectedComplaint.summary && (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        AI Triage Brief
                      </span>
                      <p className="text-xs text-slate-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        {selectedComplaint.summary}
                      </p>
                    </div>
                  )}

                  {/* Deterministic Factor Weights */}
                  {selectedComplaint.priority?.factors && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Priority Factor Contributions
                      </span>
                      <div className="space-y-1.5">
                        {selectedComplaint.priority.factors.map((f) => (
                          <div key={f.key} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-md">
                            <span className="text-slate-600 font-medium">{f.label} ({Math.round(f.weight * 100)}%)</span>
                            <span className="font-mono font-semibold text-slate-900">
                              {f.input} → +{f.contribution.toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duplicate Notification */}
                  {selectedComplaint.duplicate?.ofId && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                      <span className="font-semibold block">Linked Duplicate Reference</span>
                      <p>
                        Matched candidate {selectedComplaint.duplicate.ofId} with confidence{" "}
                        {Math.round((selectedComplaint.duplicate.score || 0) * 100)}%. Ticket is preserved without data loss.
                      </p>
                    </div>
                  )}

                  {/* Resolution Workflow Notice */}
                  <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                    <span className="font-semibold text-slate-800 block">Authority Resolution Actions</span>
                    <p>
                      In this read-only public demo, tickets are displayed for spatial audit. To test assigning officers, updating status, or submitting resolution notes, enter the <strong>Officer Desk</strong>.
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full justify-center"
                      onClick={async () => {
                        await fetch("/api/auth/demo", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ role: "officer" }),
                        });
                        router.push("/officer");
                      }}
                      rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      Enter Officer Desk
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </PageShell>
  );
}
