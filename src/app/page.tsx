import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Cpu,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  MapPin,
  Scale,
  FileText,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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

  const platformCapabilities = [
    {
      title: "Deterministic Priority Scoring",
      description:
        "Every complaint receives an explainable score (0–100) based on Safety (35%), Urgency (25%), Impact (25%), and Related Reports (15%) with an unyielding Safety Floor for immediate hazards.",
      icon: <Scale className="h-5 w-5 text-blue-600" />,
    },
    {
      title: "Geospatial Deduplication",
      description:
        "Combines Haversine distance within 150 metres and Jaccard text similarity to identify duplicate complaints automatically, eliminating backlogs while boosting priority via volume weighting.",
      icon: <MapPin className="h-5 w-5 text-cyan-600" />,
    },
    {
      title: "Resilient AI Analysis",
      description:
        "Extracts municipal categories, safety factors, and officer action briefs via high-speed language models with deterministic fallback to ensure uninterrupted 24/7 reliability.",
      icon: <Cpu className="h-5 w-5 text-violet-600" />,
    },
    {
      title: "Auditable Resolution Pipeline",
      description:
        "Clear status lifecycle from submitted to assigned, in progress, and verified resolved with complete transparency and role-governed access for citizens and officials.",
      icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
    },
  ];

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-linear-to-b from-blue-50/50 via-white to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-medium text-blue-700 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              <span>Municipal Resolution & Action Engine</span>
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
              <Link href="/demo">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore Demo
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg">
                  Citizen Registration
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
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

      {/* Platform Capabilities */}
      <section className="py-16 sm:py-20 border-b border-slate-200/80 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={
              <Badge variant="primary" size="sm">
                Engine Capabilities
              </Badge>
            }
            title="Engineered for Civic Trust"
            description="Core technologies that make CivicFlow fair, transparent, and operationally reliable for modern cities."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platformCapabilities.map((cap) => (
              <div
                key={cap.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="inline-flex rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                  {cap.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900">{cap.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Production Call-to-Action */}
      <section className="py-16 sm:py-20 bg-linear-to-b from-white to-blue-50/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-medium text-blue-700 shadow-xs">
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>Civic Action Starts Here</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready to improve your neighborhood?
          </h2>

          <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Report street hazards, water supply outages, or sanitation issues in seconds. Every complaint is tracked, prioritized, and routed to verified municipal response teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Create Citizen Account
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In to Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
