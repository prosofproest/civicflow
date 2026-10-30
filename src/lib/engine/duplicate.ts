/**
 * CivicFlow Duplicate Detection Engine
 * 
 * Implements deterministic duplicate identification combining:
 * 1. Token-based Jaccard Text Similarity
 * 2. Haversine Geographic Distance (Proximity)
 * 
 * Rules & Constraints:
 * - Compares ONLY unresolved complaints (status !== "resolved" && status !== "rejected").
 * - Filters to complaints within 150 metres.
 * - Filters to complaints within 30 days (30 * 24 * 60 * 60 * 1000 ms).
 * - Combines text similarity and geographic proximity into a unified confidence score (0.0 to 1.0).
 * - Flags candidates at confidence >= 0.60.
 * - POLICY: NEVER automatically deletes or merges complaints. Preserves every citizen's original report.
 */

import { Location } from "../../types";
import { ComplaintCandidate } from "../validation/engine";

export const DUPLICATE_MAX_DISTANCE_METERS = 150;
export const DUPLICATE_MAX_AGE_DAYS = 30;
export const DUPLICATE_CONFIDENCE_THRESHOLD = 0.60;
export const EARTH_RADIUS_METERS = 6371000;

export interface DuplicateMatchResult {
  isDuplicate: boolean;
  confidence: number;
  matchedComplaintId?: string;
  distanceMeters?: number;
  textSimilarity?: number;
  reasons: string[];
}

/**
 * Tokenizes text for Jaccard similarity:
 * - Lowercases all characters
 * - Strips non-alphanumeric characters
 * - Splits by whitespace
 * - Filters out empty tokens
 */
export function tokenizeText(text: string): Set<string> {
  if (!text) return new Set();
  const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = cleaned.split(/\s+/).filter((t) => t.length > 0);
  return new Set(tokens);
}

/**
 * Calculates token-based Jaccard similarity between two strings:
 * J(A, B) = |A ∩ B| / |A ∪ B|
 * Returns a value between 0.0 and 1.0.
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const setA = tokenizeText(textA);
  const setB = tokenizeText(textB);

  if (setA.size === 0 && setB.size === 0) return 0;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  if (unionSize === 0) return 0;

  return Number((intersectionSize / unionSize).toFixed(4));
}

/**
 * Calculates geographic distance in metres between two coordinates using the Haversine formula.
 */
export function calculateHaversineDistance(locA: Location, locB: Location): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1 = toRad(locA.lat);
  const lat2 = toRad(locB.lat);
  const deltaLat = toRad(locB.lat - locA.lat);
  const deltaLng = toRad(locB.lng - locA.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_METERS * c;

  return Number(distance.toFixed(1));
}

/**
 * Computes duplicate confidence score between two complaints:
 * - proximityScore = max(0, 1 - distance / 150)
 * - confidence = (textSimilarity * 0.6) + (proximityScore * 0.4)
 */
export function computeDuplicateConfidence(
  textSimilarity: number,
  distanceMeters: number
): number {
  if (distanceMeters > DUPLICATE_MAX_DISTANCE_METERS) {
    return 0;
  }
  const proximityScore = Math.max(0, 1 - distanceMeters / DUPLICATE_MAX_DISTANCE_METERS);
  const combined = textSimilarity * 0.6 + proximityScore * 0.4;
  return Number(combined.toFixed(3));
}

/**
 * Checks whether a complaint is eligible for duplicate consideration.
 * Must be unresolved (not 'resolved' or 'rejected') and created within 30 days.
 */
export function isEligibleCandidate(
  targetCreatedAt: string,
  candidate: ComplaintCandidate
): { eligible: boolean; reason?: string } {
  // 1. Unresolved status check
  if (candidate.status === "resolved" || candidate.status === "rejected") {
    return {
      eligible: false,
      reason: `Complaint #${candidate.id} is already ${candidate.status}`,
    };
  }

  // 2. 30-day temporal window check
  const targetTime = new Date(targetCreatedAt).getTime();
  const candidateTime = new Date(candidate.createdAt).getTime();
  const diffDays = Math.abs(targetTime - candidateTime) / (1000 * 60 * 60 * 24);

  if (diffDays > DUPLICATE_MAX_AGE_DAYS) {
    return {
      eligible: false,
      reason: `Complaint #${candidate.id} was created ${Math.round(diffDays)} days ago (exceeds ${DUPLICATE_MAX_AGE_DAYS} day window)`,
    };
  }

  return { eligible: true };
}

/**
 * Scans a target complaint against a list of candidate complaints to detect duplicates.
 * Returns the highest confidence match meeting the threshold.
 */
export function findDuplicateCandidate(
  target: ComplaintCandidate,
  candidates: ComplaintCandidate[]
): DuplicateMatchResult {
  let highestConfidence = 0;
  let bestMatch: {
    candidate: ComplaintCandidate;
    distance: number;
    textSim: number;
    confidence: number;
  } | null = null;

  for (const candidate of candidates) {
    // Skip self-comparison
    if (candidate.id === target.id) continue;

    // Filter 1 & 2: Resolved status and 30-day window
    const eligibility = isEligibleCandidate(target.createdAt, candidate);
    if (!eligibility.eligible) continue;

    // Filter 3: Geographic proximity within 150m
    const distance = calculateHaversineDistance(target.location, candidate.location);
    if (distance > DUPLICATE_MAX_DISTANCE_METERS) continue;

    // Text similarity
    const textSim = calculateJaccardSimilarity(target.text, candidate.text);

    // Combined confidence
    const confidence = computeDuplicateConfidence(textSim, distance);

    if (confidence > highestConfidence) {
      highestConfidence = confidence;
      bestMatch = {
        candidate,
        distance,
        textSim,
        confidence,
      };
    }
  }

  if (bestMatch && highestConfidence >= DUPLICATE_CONFIDENCE_THRESHOLD) {
    const reasons: string[] = [
      `Potential duplicate of unresolved complaint #${bestMatch.candidate.id}`,
      `Geographic distance: ${bestMatch.distance}m (within ${DUPLICATE_MAX_DISTANCE_METERS}m threshold)`,
      `Text lexical similarity (Jaccard): ${(bestMatch.textSim * 100).toFixed(1)}%`,
      `Combined duplicate confidence score: ${(highestConfidence * 100).toFixed(1)}% (threshold: ${(DUPLICATE_CONFIDENCE_THRESHOLD * 100)}%)`,
    ];

    return {
      isDuplicate: true,
      confidence: highestConfidence,
      matchedComplaintId: bestMatch.candidate.id,
      distanceMeters: bestMatch.distance,
      textSimilarity: bestMatch.textSim,
      reasons,
    };
  }

  return {
    isDuplicate: false,
    confidence: highestConfidence,
    reasons: highestConfidence > 0
      ? [`Highest match confidence ${(highestConfidence * 100).toFixed(1)}% did not meet ${(DUPLICATE_CONFIDENCE_THRESHOLD * 100)}% threshold.`]
      : ["No nearby unresolved complaints within 150m and 30 days."],
  };
}
