import React from "react";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Camera,
  Cpu,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  FileCheck2,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  const lifecycleStages = [
    {
      step: "01",
      name: "Capture",
      tagline: "Multimodal Citizen Intake",
      description:
        "Frictionless reporting via structured web forms and mobile uploads. Integrates geolocation, photo evidence, and intelligent category deduction.",
      icon: <Camera className="h-5 w-5 text-blue-600" aria-hidden="true" />,
      features: [
        "GPS geotagging & address reverse-lookup",
        "Visual evidence upload with metadata",
        "Instant category deduction",
      ],
      badge: "Stage 1",
    },
    {
      step: "02",
      name: "Understand",
      tagline: "AI Deduplication & Priority Scoring",
      description:
        "Automated semantic clustering detects duplicate reports within proximity radii. Multi-factor algorithmic scoring evaluates safety, urgency, and citizen impact.",
      icon: <Cpu className="h-5 w-5 text-violet-600" aria-hidden="true" />,
      features: [
        "Spatial & semantic duplicate detection",
        "Multi-factor weighted priority score",
        "Transparent factor-by-factor breakdown",
      ],
      badge: "Stage 2",
    },
    {
      step: "03",
      name: "Reveal",
      tagline: "Transparent Municipal Visibility",
      description:
        "Live triage dashboards replace opaque complaint black holes. Field officers and administrators inspect spatial heatmaps, cluster maps, and audited audit trails.",
      icon: <Eye className="h-5 w-5 text-cyan-600" aria-hidden="true" />,
      features: [
        "Geospatial cluster visualization",
        "Prioritized departmental queues",
        "Real-time SLA status monitoring",
      ],
      badge: "Stage 3",
    },
    {
      step: "04",
      name: "Act",
      tagline: "Coordinated Dispatch & Resolution",
      description:
        "Seamless departmental routing, verifiable field officer progress logs, automated citizen updates, and cryptographic or photographic resolution verification.",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />,
      features: [
        "Structured state machine transitions",
        "Officer field assignment & notes",
        "Public resolution verification log",
      ],
      badge: "Stage 4",
    },
  ];

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-linear-to-b from-blue-50/50 via-white to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              <span>PromptWars x ASTRA Hackathon — Phase 0 Foundation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              From Complaints to{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-600">
                Action
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {siteConfig.description}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/design">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore Design System
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                disabled
                title="Intake portal launches in Phase 1"
              >
                Intake Portal (Phase 1)
              </Button>
            </div>

            <p className="text-xs text-slate-400 pt-2">
              Phase 0: Architecture, Design System Tokens, and Typed Foundation.
            </p>
          </div>
        </div>
      </section>

      {/* Problem & Vision Overview */}
      <section className="py-16 sm:py-20 border-b border-slate-200/80 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={
              <Badge variant="primary" size="sm">
                Product Vision
              </Badge>
            }
            title="The Civic Infrastructure Challenge"
            description="Traditional complaint portals act as black holes: duplicates clog queues, urgent road hazards sit unclassified, and citizens receive no transparent feedback."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mb-2">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle>Opaque Triaging</CardTitle>
                <CardDescription>
                  Complaints sit in first-in first-out backlogs regardless of immediate physical danger or population impact.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/70">
                  <span className="font-semibold text-slate-800">CivicFlow solution:</span> Multi-factor priority weighting (Safety, Urgency, Impact, Proximity).
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 mb-2">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle>Duplicate Swarms</CardTitle>
                <CardDescription>
                  A single pothole or waterlogging event triggers dozens of disconnected complaints that fragment municipal response.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/70">
                  <span className="font-semibold text-slate-800">CivicFlow solution:</span> Geospatial and semantic clustering groups related incidents automatically.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mb-2">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle>Zero Public Feedback</CardTitle>
                <CardDescription>
                  Citizens disengage when portals provide no audit trail or verifiable resolution documentation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/70">
                  <span className="font-semibold text-slate-800">CivicFlow solution:</span> Real-time status transitions and verifiable photographic resolution proofs.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The 4-Stage Lifecycle */}
      <section className="py-16 sm:py-24 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={
              <Badge variant="neutral" size="sm">
                Architecture Lifecycle
              </Badge>
            }
            title="The Four Mandatory Stages"
            description="CivicFlow organizes every citizen complaint into a continuous, audited resolution pipeline."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {lifecycleStages.map((stage) => (
              <div
                key={stage.step}
                className="group relative rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-300 group-hover:text-blue-500 transition-colors">
                      {stage.step}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                      {stage.badge}
                    </span>
                  </div>

                  <div className="mb-3 inline-flex rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    {stage.icon}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {stage.name}
                  </h3>
                  <p className="text-xs font-medium text-blue-600 mb-2">
                    {stage.tagline}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-1.5">
                  {stage.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-[11px] text-slate-600"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Illustrative Telemetry (Sample Data) */}
      <section className="py-16 sm:py-20 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={
              <Badge variant="default" size="sm">
                Sample Metrics
              </Badge>
            }
            title="Operational Telemetry Preview"
            description="Illustrative metrics illustrating the target dashboard layout and triage throughput."
            action={
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                All numbers are Sample Data
              </span>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Active Complaints"
              value="1,248"
              trend="down"
              trendValue="-12%"
              helperText="vs last week"
              icon={<FileCheck2 className="h-5 w-5" />}
              isSample={true}
            />
            <StatCard
              label="Critical Hazards"
              value="34"
              trend="up"
              trendValue="+4"
              helperText="immediate dispatch"
              icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
              badge={<Badge variant="critical">Critical</Badge>}
              isSample={true}
            />
            <StatCard
              label="Clusters Identified"
              value="182"
              trend="neutral"
              trendValue="94% auto"
              helperText="duplicate savings"
              icon={<Layers className="h-5 w-5 text-cyan-600" />}
              isSample={true}
            />
            <StatCard
              label="Median SLA Time"
              value="4.2h"
              trend="down"
              trendValue="-1.8h"
              helperText="time to resolution"
              icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
              badge={<Badge variant="resolved">Resolved</Badge>}
              isSample={true}
            />
          </div>

          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50/60 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-blue-900">
                Design System Preview Available
              </h4>
              <p className="text-xs text-blue-700">
                Inspect typography, color tokens, button states, badges, inputs, and accessible states in the temporary showcase.
              </p>
            </div>
            <Link href="/design" className="shrink-0">
              <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                View /design
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
