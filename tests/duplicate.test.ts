import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateJaccardSimilarity,
  calculateHaversineDistance,
  computeDuplicateConfidence,
  isEligibleCandidate,
  findDuplicateCandidate,
  DUPLICATE_MAX_DISTANCE_METERS,
  DUPLICATE_MAX_AGE_DAYS,
  DUPLICATE_CONFIDENCE_THRESHOLD,
} from "../src/lib/engine/duplicate";
import { ComplaintCandidate } from "../src/lib/validation/engine";

test("Jaccard Text Similarity: exact, disjoint, and partial matches", () => {
  // Test duplicate confidence calculation directly
  assert.equal(computeDuplicateConfidence(1.0, 0), 1.0);
  assert.equal(computeDuplicateConfidence(0.0, DUPLICATE_MAX_DISTANCE_METERS), 0.0);
  assert.equal(DUPLICATE_MAX_AGE_DAYS, 30);

  // Exact match
  assert.equal(
    calculateJaccardSimilarity("water pipe burst on main road", "water pipe burst on main road"),
    1.0
  );

  // Case & punctuation insensitivity
  assert.equal(
    calculateJaccardSimilarity("Water Pipe Burst, Main Road!", "water pipe burst main road"),
    1.0
  );

  // Disjoint
  assert.equal(
    calculateJaccardSimilarity("fallen tree blocking driveway", "street light bulb flickering"),
    0.0
  );

  // Partial match: "pothole on park avenue" vs "huge pothole on park avenue"
  // intersection = {pothole, on, park, avenue} = 4
  // union = {huge, pothole, on, park, avenue} = 5
  // similarity = 4 / 5 = 0.8
  const partial = calculateJaccardSimilarity(
    "pothole on park avenue",
    "huge pothole on park avenue"
  );
  assert.equal(partial, 0.8);
});

test("Haversine Distance: accurately computes geographic proximity in metres", () => {
  const locA = { lat: 12.9716, lng: 77.5946 }; // Bangalore Center
  const locB = { lat: 12.9716, lng: 77.5946 }; // Same point
  assert.equal(calculateHaversineDistance(locA, locB), 0);

  // Small offset (~111 metres north is approximately 0.001 deg lat)
  const locNear = { lat: 12.9726, lng: 77.5946 };
  const distance = calculateHaversineDistance(locA, locNear);
  assert.ok(distance > 100 && distance < 120);
});

test("Duplicate Eligibility: rejects resolved or rejected complaints", () => {
  const now = new Date().toISOString();

  const activeCandidate: ComplaintCandidate = {
    id: "rep-1",
    text: "Pothole on street",
    location: { lat: 12.9716, lng: 77.5946 },
    status: "submitted",
    createdAt: now,
  };
  assert.equal(isEligibleCandidate(now, activeCandidate).eligible, true);

  const resolvedCandidate: ComplaintCandidate = {
    ...activeCandidate,
    id: "rep-2",
    status: "resolved",
  };
  assert.equal(isEligibleCandidate(now, resolvedCandidate).eligible, false);

  const rejectedCandidate: ComplaintCandidate = {
    ...activeCandidate,
    id: "rep-3",
    status: "rejected",
  };
  assert.equal(isEligibleCandidate(now, rejectedCandidate).eligible, false);
});

test("Duplicate Eligibility: rejects complaints older than 30 days", () => {
  const now = new Date();
  const targetCreatedAt = now.toISOString();

  // 10 days ago (eligible)
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const eligibleCandidate: ComplaintCandidate = {
    id: "rep-recent",
    text: "Broken sidewalk slab",
    location: { lat: 12.9716, lng: 77.5946 },
    status: "in_progress",
    createdAt: tenDaysAgo,
  };
  assert.equal(isEligibleCandidate(targetCreatedAt, eligibleCandidate).eligible, true);

  // 35 days ago (ineligible)
  const thirtyFiveDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString();
  const staleCandidate: ComplaintCandidate = {
    ...eligibleCandidate,
    id: "rep-stale",
    createdAt: thirtyFiveDaysAgo,
  };
  assert.equal(isEligibleCandidate(targetCreatedAt, staleCandidate).eligible, false);
});

test("Duplicate Detection: flags match when confidence >= 0.60 within 150m and 30 days", () => {
  const now = new Date();
  const target: ComplaintCandidate = {
    id: "target-1",
    text: "Large water leak overflowing near metro station gate 2",
    location: { lat: 12.9716, lng: 77.5946 },
    status: "submitted",
    createdAt: now.toISOString(),
  };

  // Nearby (50m away), similar text, unresolved, 2 days old
  const nearbyMatch: ComplaintCandidate = {
    id: "match-1",
    text: "Water leak overflowing at metro station gate 2",
    location: { lat: 12.9719, lng: 77.5946 }, // ~33m away
    status: "under_review",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const farAwayCandidate: ComplaintCandidate = {
    id: "far-1",
    text: "Large water leak overflowing near metro station gate 2",
    location: { lat: 13.0500, lng: 77.6500 }, // ~10km away
    status: "submitted",
    createdAt: now.toISOString(),
  };

  const result = findDuplicateCandidate(target, [nearbyMatch, farAwayCandidate]);

  assert.equal(result.isDuplicate, true);
  assert.equal(result.matchedComplaintId, "match-1");
  assert.ok(result.confidence >= DUPLICATE_CONFIDENCE_THRESHOLD);
  assert.ok(result.distanceMeters! <= DUPLICATE_MAX_DISTANCE_METERS);
  assert.ok(result.reasons.length > 0);
});

test("Duplicate Detection: does NOT flag when distance > 150m even with identical text", () => {
  const now = new Date().toISOString();
  const target: ComplaintCandidate = {
    id: "target-1",
    text: "Massive pothole in front of supermarket",
    location: { lat: 12.9716, lng: 77.5946 },
    status: "submitted",
    createdAt: now,
  };

  // 300m away (beyond 150m threshold)
  const distantCandidate: ComplaintCandidate = {
    id: "distant-1",
    text: "Massive pothole in front of supermarket",
    location: { lat: 12.9745, lng: 77.5946 }, // ~320m away
    status: "submitted",
    createdAt: now,
  };

  const result = findDuplicateCandidate(target, [distantCandidate]);
  assert.equal(result.isDuplicate, false);
});
