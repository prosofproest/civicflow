import React from "react";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  Search,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Filter,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  ROLES,
  ROLE_LABELS,
  STATUSES,
  STATUS_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
  PRIORITY_WEIGHTS,
} from "@/lib/constants";

export default function DesignSystemPage() {
  const colorTokens = [
    { name: "Primary Blue", hex: "#2563EB", class: "bg-blue-600", text: "text-white", role: "Primary Actions & Branding" },
    { name: "Brand Cyan", hex: "#06B6D4", class: "bg-cyan-500", text: "text-white", role: "Cluster & Spatial Indicators" },
    { name: "Brand Violet", hex: "#7C3AED", class: "bg-violet-600", text: "text-white", role: "AI Triage & Classification" },
    { name: "Brand Teal", hex: "#0F766E", class: "bg-teal-700", text: "text-white", role: "Infrastructure & Utilities" },
    { name: "Brand Emerald", hex: "#10B981", class: "bg-emerald-500", text: "text-white", role: "Resolved & Positive State" },
    { name: "Brand Amber", hex: "#F59E0B", class: "bg-amber-500", text: "text-white", role: "In Progress & High Urgency" },
    { name: "Brand Rose", hex: "#F43F5E", class: "bg-rose-500", text: "text-white", role: "Critical Hazard & Rejections" },
    { name: "Content Primary", hex: "#1E293B", class: "bg-slate-800", text: "text-white", role: "Headings & Primary Text" },
    { name: "Content Muted", hex: "#64748B", class: "bg-slate-500", text: "text-white", role: "Secondary & Helper Labels" },
    { name: "Surface Subtle", hex: "#F8FAFC", class: "bg-slate-50 border border-slate-300", text: "text-slate-800", role: "App & Section Backgrounds" },
    { name: "Pure Background", hex: "#FFFFFF", class: "bg-white border border-slate-300", text: "text-slate-800", role: "Cards & Elevated Surfaces" },
    { name: "Border Subtle", hex: "#E2E8F0", class: "bg-slate-200", text: "text-slate-800", role: "Dividers & Card Outlines" },
  ];

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
        {/* Header Breadcrumb */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Overview</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 mb-2">
                <Layers className="h-3.5 w-3.5" />
                <span>Phase 0 Design System Showcase</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                CivicFlow Design System
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Component library, typography scales, color tokens, and accessible states.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
                Tailwind v4 @theme
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
                Strict Light Theme
              </span>
            </div>
          </div>
        </div>

        {/* 1. Color Palette Tokens */}
        <section className="space-y-6">
          <SectionHeader
            title="1. Color Palette Tokens"
            description="Production-calibrated civic tech palette engineered for high contrast, calm readability, and municipal clarity."
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {colorTokens.map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2"
              >
                <div
                  className={`h-16 w-full rounded-lg ${c.class} flex items-end p-2`}
                >
                  <span className={`text-[10px] font-mono font-semibold ${c.text}`}>
                    {c.hex}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {c.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {c.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Typography Hierarchy */}
        <section className="space-y-6">
          <SectionHeader
            title="2. Typography Hierarchy"
            description="Font pairings utilizing Plus Jakarta Sans for headings and Inter for high-density body readability."
          />
          <Card>
            <CardContent className="divide-y divide-slate-100 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4">
                <span className="text-xs font-mono text-slate-400 w-28">Display 1</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                  Municipal Action Infrastructure
                </span>
                <span className="text-xs text-slate-400">Plus Jakarta Sans 800</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 py-4">
                <span className="text-xs font-mono text-slate-400 w-28">Heading 2</span>
                <span className="text-2xl font-bold text-slate-900">
                  Automated Duplicate Clustering & Triage
                </span>
                <span className="text-xs text-slate-400">Plus Jakarta Sans 700</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 py-4">
                <span className="text-xs font-mono text-slate-400 w-28">Heading 3</span>
                <span className="text-lg font-semibold text-slate-900">
                  Real-time SLA Tracking & Officer Dispatch
                </span>
                <span className="text-xs text-slate-400">Plus Jakarta Sans 600</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 py-4">
                <span className="text-xs font-mono text-slate-400 w-28">Body Regular</span>
                <span className="text-sm text-slate-600 max-w-xl">
                  CivicFlow normalizes citizen reports into a structured data pipeline. Every complaint undergoes spatial proximity matching and multi-factor algorithmic prioritization.
                </span>
                <span className="text-xs text-slate-400">Inter Regular 400</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-4">
                <span className="text-xs font-mono text-slate-400 w-28">Label / Mono</span>
                <span className="text-xs font-mono text-slate-600">
                  FACTOR_SAFETY_WEIGHT=0.35 | LAT: 12.9716, LNG: 77.5946
                </span>
                <span className="text-xs text-slate-400">Inter Mono 500</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. Button Component Matrix */}
        <section className="space-y-6">
          <SectionHeader
            title="3. Button Component Matrix"
            description="All variants, sizes, icon combinations, loading states, and disabled states with visible keyboard focus rings."
          />
          <div className="space-y-6">
            {/* Variants */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Variants & States</CardTitle>
                <CardDescription>Primary, Secondary, Outline, and Ghost with loading and disabled states.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="outline">Outline Action</Button>
                  <Button variant="ghost">Ghost Action</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button variant="primary" isLoading>
                    Saving Report
                  </Button>
                  <Button variant="secondary" isLoading>
                    Processing
                  </Button>
                  <Button variant="primary" disabled>
                    Disabled Primary
                  </Button>
                  <Button variant="outline" disabled>
                    Disabled Outline
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sizes & Icons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sizes & Icon Placement</CardTitle>
                <CardDescription>Small (32px), Medium (40px), and Large (44px) button sizes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}>
                    Filter (sm)
                  </Button>
                  <Button size="md" leftIcon={<ShieldCheck className="h-4 w-4" />}>
                    Verify (md)
                  </Button>
                  <Button size="lg" rightIcon={<Send className="h-4 w-4" />}>
                    Submit Report (lg)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. Badges (Priority & Status) */}
        <section className="space-y-6">
          <SectionHeader
            title="4. Badges (Priority & Status Matrix)"
            description="Clear, accessible indicators with explicit text labels. Never relying on color alone."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Priority Level Badges</CardTitle>
                <CardDescription>Derived from domain priority score thresholds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {PRIORITY_LEVELS.map((level) => (
                    <Badge key={level} variant={level} showDot>
                      {PRIORITY_LABELS[level]}
                    </Badge>
                  ))}
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 border border-slate-200/60 mt-2">
                  <div className="font-semibold text-slate-700 mb-1">Priority Weighting Model:</div>
                  Safety: {PRIORITY_WEIGHTS.safety} | Urgency: {PRIORITY_WEIGHTS.urgency} | Impact: {PRIORITY_WEIGHTS.impact} | Related: {PRIORITY_WEIGHTS.related} (Sums to 1.0)
                </div>
              </CardContent>
            </Card>

            {/* Status Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status Progression Badges</CardTitle>
                <CardDescription>All six mandatory lifecycle states.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {STATUSES.map((status) => (
                    <Badge key={status} variant={status} showDot>
                      {STATUS_LABELS[status]}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="default">Default Neutral</Badge>
                  <Badge variant="primary">Brand Primary</Badge>
                  <Badge variant="outline">Subtle Outline</Badge>
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    User Roles:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {ROLES.map((role) => (
                      <Badge key={role} variant="neutral" size="sm">
                        {ROLE_LABELS[role]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5. Form Controls */}
        <section className="space-y-6">
          <SectionHeader
            title="5. Form Inputs & Controls"
            description="Accessible input elements with visible focus states, labels, helpers, and error validation displays."
          />
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Complaint Title / Headline"
                  placeholder="e.g., Severe waterlogging near Main Road junction"
                  helperText="Provide a concise description of the civic issue."
                  required
                />

                <Input
                  label="Search / Location Filter"
                  placeholder="Filter by locality, landmark, or ID..."
                  leftIcon={<Search className="h-4 w-4" />}
                />

                <Input
                  label="Contact Email"
                  type="email"
                  defaultValue="invalid-email@"
                  error="Please enter a valid municipal or citizen email address."
                  leftIcon={<Mail className="h-4 w-4" />}
                />

                <Input
                  label="Officer Badge Number (Disabled)"
                  placeholder="OFFICER-7892"
                  disabled
                  helperText="Assigned automatically by departmental administrator."
                />

                <div className="md:col-span-2">
                  <Select
                    label="Civic Category Classification"
                    placeholder="Select issue category..."
                    options={CATEGORIES.map((c) => ({
                      value: c,
                      label: CATEGORY_LABELS[c],
                    }))}
                    helperText="AI will automatically verify and suggest this category upon photo upload."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Detailed Field Observations"
                    placeholder="Describe severity, traffic obstruction, or visible depth..."
                    rows={3}
                    helperText="Minimum 20 characters recommended for high-confidence AI factor evaluation."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 6. Stat Cards (Sample Data) */}
        <section className="space-y-6">
          <SectionHeader
            title="6. StatCard Component"
            description="KPI metric displays with trends, icons, sample data pills, and helper descriptions."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Total Reports"
              value="3,842"
              trend="up"
              trendValue="+8.4%"
              helperText="last 30 days"
              icon={<Layers className="h-5 w-5 text-blue-600" />}
              isSample={true}
            />
            <StatCard
              label="Severe Waterlogging"
              value="48"
              trend="up"
              trendValue="+12"
              helperText="monsoon surge"
              icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
              badge={<Badge variant="critical">Critical</Badge>}
              isSample={true}
            />
            <StatCard
              label="Average Resolution"
              value="5.6h"
              trend="down"
              trendValue="-2.1h"
              helperText="improved dispatch"
              icon={<Clock className="h-5 w-5 text-emerald-600" />}
              badge={<Badge variant="resolved">Resolved</Badge>}
              isSample={true}
            />
            <StatCard
              label="Resolution Rate"
              value="91.4%"
              trend="up"
              trendValue="+3.2%"
              helperText="SLA compliance"
              icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
              badge={<Badge variant="in_progress">Target 90%</Badge>}
              isSample={true}
            />
          </div>
        </section>

        {/* 7. Loading and Empty States */}
        <section className="space-y-6">
          <SectionHeader
            title="7. Loading & Empty States"
            description="Accessible feedback mechanisms for asynchronous data loading and zero-item query states."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">LoadingState Component</CardTitle>
                <CardDescription>Accessible spinner with live aria region.</CardDescription>
              </CardHeader>
              <CardContent>
                <LoadingState
                  size="md"
                  title="Evaluating Proximity Clusters..."
                  description="Cross-referencing spatial coordinates with active 500m incident radii."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">EmptyState Component</CardTitle>
                <CardDescription>Informative fallback for zero active reports.</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={<FolderOpen className="h-6 w-6 text-slate-400" />}
                  title="No Pending Critical Incidents"
                  description="All high-priority road damage and waterlogging reports have been routed to field officers."
                  action={
                    <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                      Refresh Queue
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 8. Card Layout Variants */}
        <section className="space-y-6">
          <SectionHeader
            title="8. Card Architecture"
            description="Structured modular containers supporting headers, descriptive subtitles, content sections, and actions."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader>
                <Badge variant="under_review" size="sm" className="w-fit mb-2">
                  Under Review
                </Badge>
                <CardTitle>Default White Card</CardTitle>
                <CardDescription>Standard elevated surface with subtle border.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Used for primary interactive content, complaint inspect drawers, and triage tables.
                </p>
              </CardContent>
              <CardFooter className="justify-between border-t border-slate-100 pt-4">
                <span className="text-[11px] text-slate-400 font-mono">ID: CIV-9201</span>
                <Button variant="ghost" size="sm">Inspect</Button>
              </CardFooter>
            </Card>

            <Card variant="muted">
              <CardHeader>
                <Badge variant="assigned" size="sm" className="w-fit mb-2">
                  Assigned
                </Badge>
                <CardTitle>Muted Surface Card</CardTitle>
                <CardDescription>Subtle grey background for secondary panels.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ideal for sidebar summaries, factor breakdowns, or contextual instructions.
                </p>
              </CardContent>
              <CardFooter className="justify-between border-t border-slate-200/70 pt-4">
                <span className="text-[11px] text-slate-400 font-mono">Ward 14</span>
                <Button variant="secondary" size="sm">Details</Button>
              </CardFooter>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <Badge variant="critical" size="sm" className="w-fit mb-2">
                  Critical Hazard
                </Badge>
                <CardTitle>Bordered Focus Card</CardTitle>
                <CardDescription>Sharper border emphasis for highlighted items.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Emphasizes active selections, emergency alerts, or audit focus items.
                </p>
              </CardContent>
              <CardFooter className="justify-between border-t border-slate-200 pt-4">
                <span className="text-[11px] text-rose-600 font-medium">SLA: 1.5h left</span>
                <Button variant="primary" size="sm">Dispatch</Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
