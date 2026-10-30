"use client";

import React, { useEffect, useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
import {
  ShieldAlert,
  LogOut,
  Calendar,
  AlertTriangle,
  MapPin,
  Search,
  RefreshCw,
  Map as MapIcon,
  Table as TableIcon,
  X,
  UserCheck,
  Send,
  ArrowRight,
  Database,
  CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth/auth-context";
import { Complaint, Status, Category, StatusEvent } from "@/types";
import { CATEGORIES, CATEGORY_LABELS, STATUSES, STATUS_LABELS } from "@/lib/constants";

// Dynamically import Leaflet Map to prevent SSR errors
const ComplaintMap = dynamic(() => import("@/components/map/ComplaintMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] w-full flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 gap-2">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span>Initializing OpenStreetMap Spatial Engine...</span>
    </div>
  ),
});

export default function OfficerPortalPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "map">("table");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Inspection & Action Drawer
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const mounted = useMounted();

  // Lock body scroll and close on Escape key when drawer is active
  useEffect(() => {
    if (!selectedComplaint) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedComplaint(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedComplaint]);

  // Officer Action Form State
  const [actionStatus, setActionStatus] = useState<Status>("assigned");
  const [assignedToInput, setAssignedToInput] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const fetchComplaints = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/complaints?limit=150");
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setComplaints(json.data);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/complaints?limit=150")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.ok && Array.isArray(json.data)) {
          setComplaints(json.data);
        }
      })
      .catch((err) => console.error("Initial load failed:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Open detail drawer and load status events history
  const selectComplaint = async (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setActionStatus(complaint.status);
    setAssignedToInput(complaint.assignedTo || user?.displayName || user?.email || "field_officer");
    setResolutionNote(complaint.resolutionNotes || "");
    setActionMessage(null);
    setEventsLoading(true);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}`);
      const json = await res.json();
      if (json.ok && json.data) {
        if (json.data.complaint) {
          setSelectedComplaint(json.data.complaint);
        }
        if (Array.isArray(json.data.events)) {
          setStatusEvents(json.data.events);
        }
      }
    } catch (err) {
      console.error("Failed to load complaint events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  // Submit Officer Action
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsSubmittingAction(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/complaints/${selectedComplaint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionStatus,
          assignedTo: assignedToInput.trim() || undefined,
          note: resolutionNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.ok && json.data) {
        const { complaint: updated, event } = json.data;

        // Update local complaint state
        setSelectedComplaint(updated);
        setComplaints((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );

        if (event) {
          setStatusEvents((prev) => [...prev, event]);
        }

        setActionMessage({
          type: "success",
          text: `Complaint status updated to ${STATUS_LABELS[updated.status as Status] || updated.status}. Audit event recorded.`,
        });
      } else {
        setActionMessage({
          type: "error",
          text: json.error || "Failed to update complaint.",
        });
      }
    } catch (err: unknown) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Network error updating ticket",
      });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.summary && c.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.location.address && c.location.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === "all" || c.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" || c.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || c.priority?.level === priorityFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    });
  }, [complaints, searchQuery, categoryFilter, statusFilter, priorityFilter]);

  // Operational Metrics Computation
  const stats = useMemo(() => {
    let critical = 0;
    let high = 0;
    let open = 0;
    let resolved = 0;
    const catCounts = CATEGORIES.reduce((acc, cat) => {
      acc[cat] = 0;
      return acc;
    }, {} as Record<Category, number>);

    complaints.forEach((c) => {
      if (catCounts[c.category] !== undefined) catCounts[c.category]++;
      if (c.priority?.level === "critical") critical++;
      if (c.priority?.level === "high") high++;
      if (c.status === "resolved") resolved++;
      else if (c.status !== "rejected") open++;
    });

    return {
      total: complaints.length,
      criticalHigh: critical + high,
      open,
      resolved,
      catCounts,
    };
  }, [complaints]);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Header Console */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-800 border border-cyan-200">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Field Officer Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Authority Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Departmental triage, spatial clustering, and verified status resolution console.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchComplaints}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              isLoading={authLoading}
              leftIcon={<LogOut className="h-3.5 w-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Persistence Notice Pill */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong>System Persistence Mode:</strong> Active complaints loaded. Records tagged with{" "}
              <span className="font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px]">
                Sample data
              </span>{" "}
              represent synthetic demonstration records.
            </span>
          </div>
          <span className="text-[11px] text-blue-700 bg-white/80 px-2 py-0.5 rounded border border-blue-200 shrink-0">
            Verified RBAC: {user?.role || "officer"}
          </span>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 block">Total Complaints</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.total}</span>
              <span className="text-[10px] text-slate-400 font-medium">All Sources</span>
            </div>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-rose-600 block">Critical & High Priority</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600">{stats.criticalHigh}</span>
              <span className="text-[10px] text-rose-500 font-medium">Immediate Action</span>
            </div>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-amber-700 block">Open Triage</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">{stats.open}</span>
              <span className="text-[10px] text-amber-600 font-medium">In Queue</span>
            </div>
          </Card>

          <Card className="p-4 bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-emerald-600 block">Verified Resolved</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{stats.resolved}</span>
              <span className="text-[10px] text-emerald-500 font-medium">Closed SLA</span>
            </div>
          </Card>
        </div>

        {/* Category Distribution Pills */}
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-700 block mb-2">Category Distribution:</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const count = stats.catCounts[cat] || 0;
              const isSelected = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(isSelected ? "all" : cat)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isSelected ? "bg-blue-800 text-white" : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Controls, Filters & View Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by ID, keyword, address, or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st]}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical (&gt;=75)</option>
              <option value="high">High (&gt;=55)</option>
              <option value="medium">Medium (&gt;=35)</option>
              <option value="low">Low (&lt;35)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table View ({filteredComplaints.length})</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5 text-blue-600" />
              <span>Reveal Map</span>
            </button>
          </div>
        </div>

        {/* View Mode Content */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-xs text-slate-500">Loading municipal complaint stream...</p>
          </div>
        ) : viewMode === "map" ? (
          /* Reveal Spatial Map View */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredComplaints.length} geotagged incident markers with 250m hotspot overlays</span>
              <span className="font-semibold text-blue-600">Click any marker to inspect & act</span>
            </div>
            <ComplaintMap
              complaints={filteredComplaints}
              selectedId={selectedComplaint?.id}
              onSelectComplaint={selectComplaint}
              className="h-[520px] w-full"
            />
          </div>
        ) : (
          /* Complaints Stream: Desktop Table + Mobile Card Grid */
          <div className="space-y-4">
            {/* Mobile View: Responsive Incident Cards (< md) */}
            <div className="block md:hidden space-y-3">
              {filteredComplaints.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
                  No complaints match your active filters.
                </div>
              ) : (
                filteredComplaints.map((item) => {
                  const level = item.priority?.level || "low";
                  const isDup = !!item.duplicate?.ofId;
                  const isSelected = selectedComplaint?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 bg-white shadow-xs space-y-3 transition-colors ${
                        isSelected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <span className="font-mono text-xs font-bold text-slate-800 select-all block break-all">
                            {item.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 block">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant={
                              item.status === "resolved"
                                ? "resolved"
                                : item.status === "in_progress"
                                ? "in_progress"
                                : item.status === "assigned"
                                ? "assigned"
                                : item.status === "rejected"
                                ? "rejected"
                                : "submitted"
                            }
                            size="sm"
                            showDot
                          >
                            {STATUS_LABELS[item.status as Status] || item.status}
                          </Badge>
                          {item.isSynthetic && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                              Sample data
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <p className="font-medium text-slate-800 line-clamp-2">
                          {item.summary || item.text}
                        </p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {item.location.address || `${item.location.lat.toFixed(3)}, ${item.location.lng.toFixed(3)}`}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              level === "critical"
                                ? "critical"
                                : level === "high"
                                ? "high"
                                : level === "medium"
                                ? "medium"
                                : "low"
                            }
                            size="sm"
                            showDot
                          >
                            {item.priority?.score || 0} — {level.toUpperCase()}
                          </Badge>
                          {isDup && (
                            <span className="text-[10px] font-semibold text-amber-700">
                              Duplicate ({Math.round((item.duplicate?.score || 0) * 100)}%)
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {item.assignedTo ? `Assigned: ${item.assignedTo}` : "Unassigned"}
                        </span>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => selectComplaint(item)}
                      >
                        Inspect & Act
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-52">Ticket ID</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">AI Summary / Report</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned To</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No complaints match your active filters.
                        </td>
                      </tr>
                    ) : (
                      filteredComplaints.map((item) => {
                        const level = item.priority?.level || "low";
                        const isDup = !!item.duplicate?.ofId;
                        const isSelected = selectedComplaint?.id === item.id;

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? "bg-blue-50/60" : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-800 select-all" title={item.id}>
                                  {item.id}
                                </span>
                                {item.isSynthetic && (
                                  <span className="block px-1.5 py-0.2 rounded text-[8px] font-semibold uppercase bg-purple-50 text-purple-700 w-fit border border-purple-200">
                                    Sample data
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-semibold text-slate-800">
                                {CATEGORY_LABELS[item.category] || item.category}
                              </span>
                            </td>

                            <td className="py-3 px-4 max-w-xs sm:max-w-md">
                              <p className="font-medium text-slate-800 truncate">
                                {item.summary || item.text}
                              </p>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {item.location.address || `${item.location.lat.toFixed(3)}, ${item.location.lng.toFixed(3)}`}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <Badge
                                variant={
                                  level === "critical"
                                    ? "critical"
                                    : level === "high"
                                    ? "high"
                                    : level === "medium"
                                    ? "medium"
                                    : "low"
                                }
                                size="sm"
                                showDot
                              >
                                {item.priority?.score || 0} — {level.toUpperCase()}
                              </Badge>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <Badge
                                  variant={
                                    item.status === "resolved"
                                      ? "resolved"
                                      : item.status === "in_progress"
                                      ? "in_progress"
                                      : item.status === "assigned"
                                      ? "assigned"
                                      : item.status === "rejected"
                                      ? "rejected"
                                      : "submitted"
                                  }
                                  size="sm"
                                  showDot
                                >
                                  {STATUS_LABELS[item.status as Status] || item.status}
                                </Badge>
                                {isDup && (
                                  <span className="block text-[9px] font-semibold text-amber-700">
                                    Duplicate ({Math.round((item.duplicate?.score || 0) * 100)}%)
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {item.assignedTo ? (
                                <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                                  <UserCheck className="h-3 w-3 text-blue-600" />
                                  {item.assignedTo}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Unassigned</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => selectComplaint(item)}
                              >
                                Inspect & Act
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Selected Complaint Inspection & Action Drawer (Act) */}
        {mounted && selectedComplaint && createPortal(
          <div className="fixed inset-0 z-[99999] overflow-hidden">
            {/* Backdrop: Clicking closes the drawer */}
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity z-[99999] cursor-pointer"
              onClick={() => setSelectedComplaint(null)}
              aria-hidden="true"
            />

            {/* Slide-over panel container: aligned to right, responsive full-width on mobile */}
            <div className="fixed inset-y-0 right-0 z-[100000] flex max-w-full pointer-events-none pl-0 sm:pl-10">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="ticket-review-title"
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-screen max-w-full sm:max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200"
              >
                {/* Drawer Header */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 select-all truncate" title={selectedComplaint.id}>
                        {selectedComplaint.id}
                      </span>
                      {selectedComplaint.isSynthetic && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                          Sample data
                        </span>
                      )}
                    </div>
                    <h2 id="ticket-review-title" className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {CATEGORY_LABELS[selectedComplaint.category]} Ticket Review
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    aria-label="Close ticket review drawer"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* Feedback Alert */}
                {actionMessage && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                      actionMessage.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    {actionMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{actionMessage.text}</span>
                  </div>
                )}

                {/* Report Details */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <span className="font-semibold text-slate-700 block">Citizen Report Narrative:</span>
                  <p className="text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    {selectedComplaint.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {selectedComplaint.location.address || `${selectedComplaint.location.lat}, ${selectedComplaint.location.lng}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(selectedComplaint.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* AI Triage & Summary */}
                <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-violet-900">AI Triage Summary & Action Brief:</span>
                    <span className="text-[10px] font-mono text-violet-700">
                      Model: {selectedComplaint.aiMeta?.model || "groq-llama-3.3-70b"} ({selectedComplaint.aiMeta?.status || "ok"})
                    </span>
                  </div>
                  <p className="text-violet-950 font-medium leading-relaxed">
                    {selectedComplaint.summary || "Summary generated by intake pipeline."}
                  </p>
                </div>

                {/* Deterministic Priority Score Breakdown */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block text-sm">
                        Priority Score: {selectedComplaint.priority?.score}/100
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Level: {selectedComplaint.priority?.level.toUpperCase()}
                      </span>
                    </div>
                    <Badge
                      variant={
                        selectedComplaint.priority?.level === "critical"
                          ? "critical"
                          : selectedComplaint.priority?.level === "high"
                          ? "high"
                          : "medium"
                      }
                      size="md"
                      showDot
                    >
                      {selectedComplaint.priority?.level.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {selectedComplaint.priority?.explanation}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {selectedComplaint.priority?.factors.map((f) => (
                      <div key={f.key} className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">{f.label} ({Math.round(f.weight * 100)}%)</span>
                        <span className="font-bold text-slate-800">{f.input}/100</span>
                        <span className="text-[10px] text-slate-500 block">+{f.contribution} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duplicate Flag Alert */}
                {selectedComplaint.duplicate?.ofId && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 space-y-1 text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="h-4 w-4 text-amber-700" />
                      <span>Duplicate Complaint Candidate Detected</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Matches earlier ticket <strong>{selectedComplaint.duplicate.ofId}</strong> with{" "}
                      {Math.round((selectedComplaint.duplicate.score || 0) * 100)}% confidence.
                    </p>
                    {selectedComplaint.duplicate.reasons?.length > 0 && (
                      <ul className="list-disc list-inside text-[10px] text-amber-800">
                        {selectedComplaint.duplicate.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Saved Resolution Notes */}
                {selectedComplaint.resolutionNotes && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      <span>Saved Officer Resolution Notes</span>
                    </div>
                    <p className="text-emerald-950 font-medium leading-relaxed bg-white p-3 rounded-lg border border-emerald-200">
                      {selectedComplaint.resolutionNotes}
                    </p>
                  </div>
                )}

                {/* Officer Action Console (ACT) */}
                <form onSubmit={handleActionSubmit} className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <span className="font-bold text-blue-900 text-sm">Execute Officer Action</span>
                    <span className="text-[10px] font-semibold text-blue-700">Authenticated Actor: {user?.role}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-medium text-slate-700 block">Lifecycle Status:</label>
                      <select
                        value={actionStatus}
                        onChange={(e) => setActionStatus(e.target.value as Status)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABELS[st]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-slate-700 block">Assign To Officer:</label>
                      <input
                        type="text"
                        value={assignedToInput}
                        onChange={(e) => setAssignedToInput(e.target.value)}
                        placeholder="Officer ID or Email"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700 block">Officer / Resolution Notes:</label>
                    <textarea
                      rows={3}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Enter field inspection notes, dispatch team details, or verified resolution confirmation..."
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={isSubmittingAction}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Commit Status Update & Record Audit Event
                  </Button>
                </form>

                {/* Audit Timeline: Status Events */}
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-slate-800 block text-sm">
                    Verified Status Progression History (status_events):
                  </span>

                  {eventsLoading ? (
                    <div className="p-4 text-center text-slate-400">Loading audit history...</div>
                  ) : statusEvents.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center border border-slate-200">
                      No status transitions recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {statusEvents.map((ev, index) => (
                        <div
                          key={ev.id || index}
                          className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <span className="capitalize">{ev.from || "Start"}</span>
                              <ArrowRight className="h-3 w-3 text-slate-400" />
                              <Badge variant={ev.to === "resolved" ? "resolved" : "primary"} size="sm">
                                {STATUS_LABELS[ev.to] || ev.to}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ev.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span>Actor: {ev.actorUid} ({ev.actorRole})</span>
                          </div>

                          {ev.note && (
                            <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                              &ldquo;{ev.note}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
