/**
 * CivicFlow Domain Constants
 * Centralized constant definitions with 'as const' assertions.
 */

export const CATEGORIES = [
  "waterlogging",
  "road_damage",
  "waste",
  "streetlight",
  "drainage",
  "water_supply",
  "public_safety",
  "other",
] as const;

export const ROLES = ["citizen", "officer", "admin"] as const;

export const STATUSES = [
  "submitted",
  "under_review",
  "assigned",
  "in_progress",
  "resolved",
  "rejected",
] as const;

/**
 * Priority scoring weights.
 * NOTE: The weights must strictly sum to 1.0 (0.35 + 0.25 + 0.25 + 0.15 = 1.00).
 */
export const PRIORITY_WEIGHTS = {
  safety: 0.35,
  urgency: 0.25,
  impact: 0.25,
  related: 0.15,
} as const;

export const PRIORITY_LEVELS = ["critical", "high", "medium", "low"] as const;

export const PRIORITY_THRESHOLDS = {
  critical: 75,
  high: 55,
  medium: 35,
} as const;

export const STATUS_TRANSITIONS: Record<(typeof STATUSES)[number], readonly (typeof STATUSES)[number][]> = {
  submitted: ["under_review", "assigned", "rejected"],
  under_review: ["assigned", "rejected"],
  assigned: ["in_progress", "rejected"],
  in_progress: ["resolved", "assigned"],
  resolved: [],
  rejected: [],
} as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  waterlogging: "Waterlogging",
  road_damage: "Road Damage",
  waste: "Waste Management",
  streetlight: "Streetlight",
  drainage: "Drainage",
  water_supply: "Water Supply",
  public_safety: "Public Safety",
  other: "Other",
} as const;

export const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
} as const;

export const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
  citizen: "Citizen",
  officer: "Officer",
  admin: "Admin",
} as const;

export const PRIORITY_LABELS: Record<(typeof PRIORITY_LEVELS)[number], string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
} as const;

export function getPriorityLevel(score: number): (typeof PRIORITY_LEVELS)[number] {
  if (score >= PRIORITY_THRESHOLDS.critical) return "critical";
  if (score >= PRIORITY_THRESHOLDS.high) return "high";
  if (score >= PRIORITY_THRESHOLDS.medium) return "medium";
  return "low";
}
