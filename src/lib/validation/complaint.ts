/**
 * CivicFlow Complaint Validation Schemas
 * Validates citizen complaint submissions and query filters.
 */

import { z } from "zod";
import { CATEGORIES, STATUSES, PRIORITY_LEVELS } from "@/lib/constants";
import { locationSchema } from "@/lib/validation/engine";

export const createComplaintSchema = z.object({
  text: z
    .string()
    .min(10, "Complaint description must be at least 10 characters long")
    .max(2000, "Complaint description cannot exceed 2,000 characters"),
  category: z.enum(CATEGORIES),
  location: locationSchema,
  imageUrl: z
    .string()
    .url("Image must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export const complaintQuerySchema = z.object({
  reporterOnly: z.enum(["true", "false"]).optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITY_LEVELS).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type ComplaintQueryInput = z.infer<typeof complaintQuerySchema>;
