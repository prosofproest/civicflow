/**
 * CivicFlow Complaint Processing Pipeline & Repository
 * 
 * Implements the end-to-end complaint lifecycle:
 * 1. Input Validation
 * 2. Authenticated Session Enforcement
 * 3. AI Categorization, Summarization, and Factor Extraction (Groq with Deterministic Fallback)
 * 4. Deterministic Duplicate Detection (Jaccard + Haversine within 150m, 30 days)
 * 5. Related Reports Proximity Calculation
 * 6. Deterministic Priority Engine Evaluation (incorporating Safety Keyword Floor)
 * 7. Persistence (Firestore if configured, or Graceful In-Memory Store if unconfigured)
 * 
 * Strict Hackathon Constraints:
 * - NEVER automatically deletes or merges complaints.
 * - Stores duplicate relationships as references.
 * - Transparently stores explainable priority factor contributions.
 */

import { Complaint, Category, Status, Role, StatusEvent } from "@/types";
import { CreateComplaintInput } from "@/lib/validation/complaint";
import { analyzeComplaintWithAi } from "@/lib/ai/groq";
import {
  findDuplicateCandidate,
  calculateHaversineDistance,
} from "@/lib/engine/duplicate";
import { calculatePriority } from "@/lib/engine/priority";
import { SYNTHETIC_COMPLAINTS } from "@/lib/data/mock-complaints";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { ComplaintCandidate } from "@/lib/validation/engine";
import { CATEGORIES } from "@/lib/constants";

// In-memory store for user submissions during local hackathon demo mode
const inMemoryComplaints: Map<string, Complaint> = new Map();
const inMemoryStatusEvents: Map<string, StatusEvent[]> = new Map();

/**
 * Strips undefined properties before writing to Firestore.
 */
function sanitizeForFirestore(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = sanitizeForFirestore(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Initializes the in-memory store with synthetic demo reports if empty.
 */
function ensureDemoStoreInitialized() {
  if (inMemoryComplaints.size === 0) {
    for (const report of SYNTHETIC_COMPLAINTS) {
      inMemoryComplaints.set(report.id, report);
    }
  }
}

/**
 * Retrieves candidate complaints formatted for duplicate detection.
 */
async function getCandidateComplaints(): Promise<ComplaintCandidate[]> {
  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      const snapshot = await db
        .collection("complaints")
        .where("status", "in", ["submitted", "under_review", "assigned", "in_progress"])
        .limit(100)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => {
          const data = doc.data() as Complaint;
          return {
            id: data.id || doc.id,
            text: data.text,
            location: data.location,
            status: data.status,
            createdAt: data.createdAt,
          };
        });
      }
    } catch (err) {
      console.warn("Firestore query failed, falling back to local store for duplicate candidate check:", err);
    }
  }

  ensureDemoStoreInitialized();
  return Array.from(inMemoryComplaints.values())
    .filter((c) => c.status !== "resolved" && c.status !== "rejected")
    .map((c) => ({
      id: c.id,
      text: c.text,
      location: c.location,
      status: c.status,
      createdAt: c.createdAt,
    }));
}

/**
 * Executes the complete complaint processing pipeline.
 */
export async function createComplaint(
  input: CreateComplaintInput,
  reporterUid: string
): Promise<Complaint> {
  const now = new Date().toISOString();
  const complaintId = `complaint_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Run AI analysis (Groq or deterministic fallback)
  const aiResult = await analyzeComplaintWithAi(input.text, input.category);
  const { analysis, aiMeta } = aiResult;

  // 2. Fetch active candidates and run deterministic duplicate detection
  const candidates = await getCandidateComplaints();
  const targetCandidate: ComplaintCandidate = {
    id: complaintId,
    text: input.text,
    location: input.location,
    status: "submitted",
    createdAt: now,
  };

  const duplicateResult = findDuplicateCandidate(targetCandidate, candidates);

  // 3. Calculate related report count within 250m
  const relatedReports = candidates.filter(
    (c) => calculateHaversineDistance(input.location, c.location) <= 250
  );
  const relatedCount = relatedReports.length;

  // 4. Calculate final priority using Phase 2 Deterministic Priority Engine
  const priorityResult = calculatePriority({
    text: input.text,
    safety: analysis.safety,
    urgency: analysis.urgency,
    impact: analysis.impact,
    relatedCount,
    category: input.category,
  });

  // 5. Assemble fully typed Complaint record
  const newComplaint: Complaint = {
    id: complaintId,
    reporterUid,
    text: input.text,
    ...(input.imageUrl && input.imageUrl.trim().length > 0 ? { imageUrl: input.imageUrl.trim() } : {}),
    category: input.category,
    aiCategory: analysis.category,
    summary: analysis.summary,
    location: input.location,
    status: "submitted",
    priority: {
      score: priorityResult.score,
      level: priorityResult.level,
      factors: priorityResult.factors,
      explanation: priorityResult.explanation,
    },
    duplicate: {
      ofId: duplicateResult.matchedComplaintId,
      score: duplicateResult.confidence,
      reasons: duplicateResult.reasons,
    },
    relatedCount,
    aiMeta: {
      status: aiMeta.status,
      model: aiMeta.model,
    },
    isSynthetic: false,
    createdAt: now,
    updatedAt: now,
  };

  // 6. Save to storage
  if (isFirebaseAdminConfigured()) {
    const db = getAdminFirestore();
    const firestoreData = sanitizeForFirestore(newComplaint as unknown as Record<string, unknown>);
    await db.collection("complaints").doc(complaintId).set(firestoreData);
  }

  // Always retain in in-memory store for session continuity
  ensureDemoStoreInitialized();
  inMemoryComplaints.set(complaintId, newComplaint);

  return newComplaint;
}

/**
 * Retrieves complaints with optional filtering by reporter, category, status, or limit.
 */
export async function getComplaints(options?: {
  reporterUid?: string;
  category?: Category;
  status?: string;
  limit?: number;
}): Promise<Complaint[]> {
  const maxLimit = options?.limit || 100;

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      let query: FirebaseFirestore.Query = db.collection("complaints");

      if (options?.reporterUid) {
        query = query.where("reporterUid", "==", options.reporterUid);
      }
      if (options?.category) {
        query = query.where("category", "==", options.category);
      }
      if (options?.status) {
        query = query.where("status", "==", options.status);
      }

      const snapshot = await query.limit(maxLimit).get();
      if (!snapshot.empty) {
        const results = snapshot.docs.map((doc) => doc.data() as Complaint);
        // Sort descending by creation date
        results.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return results;
      }
    } catch (err) {
      console.warn("Firestore query failed, serving from local store:", err);
    }
  }

  // Fallback / Demo Mode
  ensureDemoStoreInitialized();
  let results = Array.from(inMemoryComplaints.values());

  if (options?.reporterUid) {
    results = results.filter((c) => c.reporterUid === options.reporterUid);
  }
  if (options?.category) {
    results = results.filter((c) => c.category === options.category);
  }
  if (options?.status) {
    results = results.filter((c) => c.status === options.status);
  }

  results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return results.slice(0, maxLimit);
}

/**
 * Seeds the synthetic dataset into Firestore if configured.
 */
export async function seedSyntheticDataset(): Promise<{ seededCount: number; isFirestore: boolean }> {
  ensureDemoStoreInitialized();

  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      const batch = db.batch();

      for (const report of SYNTHETIC_COMPLAINTS) {
        const docRef = db.collection("complaints").doc(report.id);
        batch.set(docRef, report, { merge: true });
      }

      await batch.commit();
      return { seededCount: SYNTHETIC_COMPLAINTS.length, isFirestore: true };
    } catch (err) {
      console.warn("Failed to batch seed into Firestore, populated in-memory store:", err);
    }
  }

  return { seededCount: SYNTHETIC_COMPLAINTS.length, isFirestore: false };
}

/**
 * Retrieves a single complaint by its unique ID.
 */
export async function getComplaintById(id: string): Promise<Complaint | null> {
  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("complaints").doc(id).get();
      if (doc.exists) {
        return doc.data() as Complaint;
      }
    } catch (err) {
      console.warn(`Firestore getComplaintById failed for ${id}, checking local store:`, err);
    }
  }

  ensureDemoStoreInitialized();
  return inMemoryComplaints.get(id) || null;
}

/**
 * Updates a complaint's status and/or assigned officer, recording a verified StatusEvent.
 */
export async function updateComplaint(
  id: string,
  updates: {
    status?: Status;
    assignedTo?: string;
    note?: string;
  },
  actor: {
    uid: string;
    role: Role;
  }
): Promise<{ complaint: Complaint; event: StatusEvent }> {
  ensureDemoStoreInitialized();
  const existing = await getComplaintById(id);

  if (!existing) {
    throw new Error(`Complaint ${id} not found`);
  }

  const now = new Date().toISOString();
  const oldStatus = existing.status;
  const newStatus = updates.status || oldStatus;

  // Build the audit event
  const event: StatusEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    complaintId: id,
    from: oldStatus === newStatus ? null : oldStatus,
    to: newStatus,
    actorUid: actor.uid,
    actorRole: actor.role,
    note: updates.note || undefined,
    createdAt: now,
  };

  // Update complaint properties
  const updatedComplaint: Complaint = {
    ...existing,
    status: newStatus,
    assignedTo: updates.assignedTo !== undefined ? updates.assignedTo : existing.assignedTo,
    resolutionNotes: updates.note !== undefined ? updates.note : existing.resolutionNotes,
    updatedAt: now,
  };

  // 1. Persist to Firestore if configured
  if (isFirebaseAdminConfigured()) {
    const db = getAdminFirestore();
    const batch = db.batch();
    const updatesData: Record<string, unknown> = {
      status: updatedComplaint.status,
      updatedAt: now,
    };
    if (updatedComplaint.assignedTo) updatesData.assignedTo = updatedComplaint.assignedTo;
    if (updatedComplaint.resolutionNotes) updatesData.resolutionNotes = updatedComplaint.resolutionNotes;

    batch.update(db.collection("complaints").doc(id), updatesData);
    batch.set(
      db.collection("status_events").doc(event.id),
      sanitizeForFirestore(event as unknown as Record<string, unknown>)
    );
    await batch.commit();
  }

  // 2. Always persist in in-memory demo store
  inMemoryComplaints.set(id, updatedComplaint);

  const existingEvents = inMemoryStatusEvents.get(id) || [];
  inMemoryStatusEvents.set(id, [...existingEvents, event]);

  return { complaint: updatedComplaint, event };
}

/**
 * Retrieves the status progression history (audit trail) for a complaint.
 */
export async function getStatusEvents(complaintId: string): Promise<StatusEvent[]> {
  if (isFirebaseAdminConfigured()) {
    try {
      const db = getAdminFirestore();
      const snapshot = await db
        .collection("status_events")
        .where("complaintId", "==", complaintId)
        .get();

      if (!snapshot.empty) {
        const events = snapshot.docs.map((doc) => doc.data() as StatusEvent);
        events.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return events;
      }
    } catch (err) {
      console.warn(`Firestore getStatusEvents failed for ${complaintId}, checking local store:`, err);
    }
  }

  const localEvents = inMemoryStatusEvents.get(complaintId) || [];
  if (localEvents.length > 0) {
    return localEvents;
  }

  // Synthesize initial submission event if none recorded yet
  const complaint = inMemoryComplaints.get(complaintId);
  if (complaint) {
    const initialEvent: StatusEvent = {
      id: `event_init_${complaintId}`,
      complaintId,
      from: null,
      to: "submitted",
      actorUid: complaint.reporterUid,
      actorRole: "citizen",
      note: "Initial complaint submitted via intake portal",
      createdAt: complaint.createdAt,
    };
    return [initialEvent];
  }

  return [];
}

export interface ComplaintStats {
  total: number;
  critical: number;
  high: number;
  open: number;
  resolved: number;
  byCategory: Record<Category, number>;
  byPriority: Record<string, number>;
}

/**
 * Computes high-level distribution statistics across complaints.
 */
export async function getComplaintStats(): Promise<ComplaintStats> {
  const all = await getComplaints({ limit: 500 });

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<Category, number>);

  const byPriority: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  let critical = 0;
  let high = 0;
  let open = 0;
  let resolved = 0;

  for (const c of all) {
    if (byCategory[c.category] !== undefined) {
      byCategory[c.category]++;
    }
    const prioLevel = c.priority?.level || "low";
    byPriority[prioLevel] = (byPriority[prioLevel] || 0) + 1;

    if (prioLevel === "critical") critical++;
    if (prioLevel === "high") high++;

    if (c.status === "resolved") {
      resolved++;
    } else if (c.status !== "rejected") {
      open++;
    }
  }

  return {
    total: all.length,
    critical,
    high,
    open,
    resolved,
    byCategory,
    byPriority,
  };
}
