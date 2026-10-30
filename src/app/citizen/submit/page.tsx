"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { detectSafetyHazard } from "@/lib/engine/priority";
import { Complaint, Category } from "@/types";

export default function CitizenSubmitPage() {

  // Form State
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("waterlogging");
  const [lat, setLat] = useState("12.9716");
  const [lng, setLng] = useState("77.5946");
  const [address, setAddress] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPrefilled, setIsPrefilled] = useState(false);

  // Status & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);

  // Populate from URL search params or assistant prefill
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const search = new URLSearchParams(window.location.search);
    const prefillDesc = search.get("description") || search.get("text");
    const prefillCat = search.get("category");
    const prefillAddr = search.get("address");
    const prefillLat = search.get("lat");
    const prefillLng = search.get("lng");

    const timer = setTimeout(() => {
      let filled = false;
      if (prefillDesc) {
        setDescription(decodeURIComponent(prefillDesc));
        filled = true;
      }
      if (prefillCat && CATEGORIES.includes(prefillCat as Category)) {
        setCategory(prefillCat as Category);
        filled = true;
      }
      if (prefillAddr) {
        setAddress(decodeURIComponent(prefillAddr));
        filled = true;
      }
      if (prefillLat) {
        setLat(prefillLat);
        filled = true;
      }
      if (prefillLng) {
        setLng(prefillLng);
        filled = true;
      }
      if (filled) {
        setIsPrefilled(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Real-time immediate safety hazard detection
  const detectedHazard = detectSafetyHazard(description);

  // GPS Geolocation Handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setErrorMessage(
          err.code === 1
            ? "Location permission denied. Please enter coordinates manually."
            : "Failed to acquire GPS position. Please enter coordinates manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Image Selection Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image exceeds the 5MB size limit.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setErrorMessage(null);
  };

  // Form Submission Pipeline Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent repeated double-clicks
    setErrorMessage(null);

    if (description.trim().length < 10) {
      setErrorMessage("Please provide a detailed description (at least 10 characters).");
      return;
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setErrorMessage("Latitude must be a valid number between -90 and 90.");
      return;
    }

    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setErrorMessage("Longitude must be a valid number between -180 and 180.");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl: string | undefined;

      // Cloudinary image upload attempt if image was chosen
      if (imageFile) {
        try {
          const sigRes = await fetch("/api/upload/signature");
          const sigData = await sigRes.json();

          if (sigData.ok && sigData.configured) {
            const formData = new FormData();
            formData.append("file", imageFile);
            formData.append("api_key", sigData.apiKey);
            formData.append("timestamp", sigData.timestamp.toString());
            formData.append("signature", sigData.signature);
            formData.append("folder", sigData.folder);

            const uploadRes = await fetch(
              `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
              { method: "POST", body: formData }
            );

            if (uploadRes.ok) {
              const uploadPayload = await uploadRes.json();
              finalImageUrl = uploadPayload.secure_url;
            }
          }
        } catch {
          // Graceful fallback to text report if Cloudinary upload fails
          console.warn("Cloudinary upload failed or unconfigured; continuing with text complaint.");
        }
      }

      // Submit complaint to API pipeline
      const payload = {
        text: description.trim(),
        category,
        location: {
          lat: parsedLat,
          lng: parsedLng,
          address: address.trim() || undefined,
        },
        imageUrl: finalImageUrl,
      };

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to process complaint");
      }

      setCreatedComplaint(data.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission error occurred";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // SUCCESS VIEW
  // =========================================================================
  if (createdComplaint) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
          <Card className="border-emerald-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-emerald-600 px-6 py-6 text-white text-center space-y-2">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Complaint Successfully Registered
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100">
                Ticket Reference: <span className="font-mono font-bold">{createdComplaint.id}</span>
              </p>
            </div>

            <CardContent className="space-y-6 pt-6 text-xs sm:text-sm">
              {/* Triage Overview Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-medium">Assigned Priority</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        createdComplaint.priority.level === "critical"
                          ? "critical"
                          : createdComplaint.priority.level === "high"
                          ? "high"
                          : createdComplaint.priority.level === "medium"
                          ? "medium"
                          : "low"
                      }
                      size="md"
                      showDot
                    >
                      {createdComplaint.priority.score}/100 — {createdComplaint.priority.level.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-medium">Municipal Category</span>
                  <div>
                    <Badge variant="neutral" size="md">
                      {CATEGORY_LABELS[createdComplaint.category]}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-medium">Initial Status</span>
                  <div>
                    <Badge variant="neutral" size="md">
                      Submitted
                    </Badge>
                  </div>
                </div>
              </div>

              {/* AI Processing Summary */}
              <div className="space-y-1.5 rounded-xl bg-blue-50/70 p-4 border border-blue-200 text-blue-900">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-blue-800">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>AI Structured Summary ({createdComplaint.aiMeta.status === "ok" ? "Groq LLM" : "Deterministic Fallback"})</span>
                </div>
                <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                  {createdComplaint.summary}
                </p>
              </div>

              {/* Duplicate Detection Alert if flagged */}
              {createdComplaint.duplicate.ofId && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
                  <span className="font-semibold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Duplicate Candidate Flagged
                  </span>
                  <p className="text-amber-700 leading-relaxed">
                    Matched nearby active ticket <span className="font-mono font-bold">#{createdComplaint.duplicate.ofId}</span> ({(Number(createdComplaint.duplicate.score || 0) * 100).toFixed(0)}% confidence). Both reports remain active for administrative correlation.
                  </p>
                </div>
              )}

              {/* Explainable Factor Breakdown */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-800 text-xs block">
                  Deterministic Priority Factors:
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {createdComplaint.priority.explanation}
                </p>
              </div>

              {/* Location Summary */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate">
                  {createdComplaint.location.address || "Recorded at coordinates"}: {createdComplaint.location.lat.toFixed(5)}, {createdComplaint.location.lng.toFixed(5)}
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 border-t border-slate-200 p-4">
              <Link href="/citizen/complaints" className="w-full sm:w-auto flex-1">
                <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  View My Complaints
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setCreatedComplaint(null);
                  setDescription("");
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                Submit Another Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </PageShell>
    );
  }

  // =========================================================================
  // SUBMISSION FORM VIEW
  // =========================================================================
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link
            href="/citizen"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Citizen Workspace</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium">Stage 1 — Capture</span>
        </div>

        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report a Civic Issue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Submit municipal infrastructure failures for AI categorization, priority triage, and departmental dispatch.
          </p>
        </div>

        {/* Assistant Prefill Banner */}
        {isPrefilled && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3.5 text-xs text-blue-900 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                <strong>CivicFlow AI Assistant</strong> pre-filled this draft based on your chat conversation. Please review the details below and confirm submission.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPrefilled(false)}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs flex items-start gap-3"
          >
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0 flex-1 break-words">
              <span className="font-semibold block">Submission Error</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <Card className="shadow-xs">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              {/* Category Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>Municipal Category</span>
                  <span className="text-[11px] text-slate-400 font-normal">Select primary category</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((catKey) => {
                    const isSelected = category === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCategory(catKey)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xs ring-1 ring-blue-400 font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {CATEGORY_LABELS[catKey]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="description" className="text-xs font-semibold text-slate-800">
                    Incident Description <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {description.length}/2,000 characters
                  </span>
                </div>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue with specific details (e.g. Deep crater pothole opposite Metro Pillar 42, causing vehicle skidding during evening rain...)"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition-colors"
                  required
                />

                {/* Real-time Immediate Hazard Banner */}
                {detectedHazard && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Critical Safety Keyword Detected: &quot;{detectedHazard}&quot;</span>
                      <p className="text-amber-700 text-[11px]">
                        The Deterministic Safety Floor Rule will automatically elevate this complaint to Critical Priority upon submission.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Coordinates & GPS Picker */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>Incident Location</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Coordinates used for spatial duplicate detection and hotspot clustering.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectLocation}
                    isLoading={isLocating}
                    leftIcon={<Navigation className="h-3.5 w-3.5 text-blue-600" />}
                  >
                    Auto-Detect GPS
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Latitude"
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="e.g. 12.9716"
                    required
                  />
                  <Input
                    label="Longitude"
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="e.g. 77.5946"
                    required
                  />
                </div>

                <Input
                  label="Landmark / Street Address (Optional)"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 10th Cross, Opposite Central Library"
                />
              </div>

              {/* Image Evidence (Cloudinary Optional) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-slate-500" />
                  <span>Photo Evidence (Optional)</span>
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />

                  {imagePreview && (
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Upload preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Max 5MB. If Cloudinary credentials are not configured in local environment, report is safely submitted as text-only.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 border-t border-slate-200 p-4">
              <span className="text-[11px] text-slate-400">
                Deterministic duplicate detection & priority scoring execute on submission.
              </span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Submit Complaint
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
