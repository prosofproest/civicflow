import { z } from "zod";
import { CATEGORIES, STATUSES } from "../constants";

export const locationSchema = z.object({
  lat: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  lng: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  address: z.string().optional(),
});

export const priorityInputSchema = z.object({
  text: z.string().min(1, "Complaint text is required"),
  safety: z.number().min(0, "Safety score must be between 0 and 100").max(100, "Safety score must be between 0 and 100").optional(),
  urgency: z.number().min(0, "Urgency score must be between 0 and 100").max(100, "Urgency score must be between 0 and 100").optional(),
  impact: z.number().min(0, "Impact score must be between 0 and 100").max(100, "Impact score must be between 0 and 100").optional(),
  relatedCount: z.number().int().min(0, "Related count must be non-negative").default(0),
  category: z.enum(CATEGORIES).optional(),
});

export const complaintCandidateSchema = z.object({
  id: z.string().min(1, "Complaint ID cannot be empty"),
  text: z.string().min(1, "Complaint text cannot be empty"),
  location: locationSchema,
  status: z.enum(STATUSES),
  createdAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "createdAt must be a valid ISO date string",
  }),
});

export const duplicateCheckSchema = z.object({
  target: complaintCandidateSchema,
  candidates: z.array(complaintCandidateSchema),
});

export const hotspotReportSchema = z.object({
  id: z.string().min(1, "Report ID is required"),
  location: locationSchema,
  status: z.enum(STATUSES).optional(),
  createdAt: z.string().optional(),
});

export const hotspotInputSchema = z.object({
  reports: z.array(hotspotReportSchema).min(1, "At least one report is required"),
});

export type PriorityInput = z.infer<typeof priorityInputSchema>;
export type ComplaintCandidate = z.infer<typeof complaintCandidateSchema>;
export type DuplicateCheckInput = z.infer<typeof duplicateCheckSchema>;
export type HotspotReportInput = z.infer<typeof hotspotReportSchema>;
