/**
 * CivicFlow Core Domain Types
 * Strict typing across models, complaints, users, and audit events.
 */

import {
  CATEGORIES,
  ROLES,
  STATUSES,
  PRIORITY_LEVELS,
} from "@/lib/constants";

export type Category = (typeof CATEGORIES)[number];
export type Role = (typeof ROLES)[number];
export type Status = (typeof STATUSES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  active: boolean;
  createdAt: string; // ISO 8601 string
}

export interface PriorityFactor {
  key: string;
  label: string;
  input: number;
  weight: number;
  contribution: number;
}

export interface Priority {
  score: number;
  level: PriorityLevel;
  factors: PriorityFactor[];
  explanation: string;
}

export interface Duplicate {
  ofId?: string;
  score?: number;
  reasons: string[];
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface AiMeta {
  status: "ok" | "fallback";
  model: string;
}

export interface Complaint {
  id: string;
  reporterUid: string;
  text: string;
  imageUrl?: string;
  category: Category;
  aiCategory: Category;
  summary: string;
  location: Location;
  status: Status;
  assignedTo?: string;
  priority: Priority;
  duplicate: Duplicate;
  clusterId?: string;
  relatedCount: number;
  aiMeta: AiMeta;
  isSynthetic: boolean;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

export interface StatusEvent {
  id: string;
  complaintId: string;
  from: Status | null;
  to: Status;
  actorUid: string;
  actorRole: Role;
  note?: string;
  createdAt: string; // ISO 8601 string
}
