import test from "node:test";
import assert from "node:assert/strict";
import {
  priorityInputSchema,
  locationSchema,
  complaintCandidateSchema,
  duplicateCheckSchema,
  hotspotInputSchema,
} from "../src/lib/validation/engine";

test("Location Validation: enforces latitude (-90 to 90) and longitude (-180 to 180)", () => {
  // Valid coordinate
  const valid = locationSchema.safeParse({ lat: 12.9716, lng: 77.5946 });
  assert.equal(valid.success, true);

  // Invalid latitude
  const invalidLat = locationSchema.safeParse({ lat: 95.0, lng: 77.5946 });
  assert.equal(invalidLat.success, false);

  // Invalid longitude
  const invalidLng = locationSchema.safeParse({ lat: 12.9716, lng: 185.0 });
  assert.equal(invalidLng.success, false);
});

test("Priority Input Validation: requires non-empty text and enforces factor bounds [0, 100]", () => {
  // Valid input
  const valid = priorityInputSchema.safeParse({
    text: "Pothole on main street",
    safety: 50,
    urgency: 40,
    impact: 60,
    relatedCount: 2,
    category: "road_damage",
  });
  assert.equal(valid.success, true);

  // Empty text rejected
  const emptyText = priorityInputSchema.safeParse({
    text: "",
  });
  assert.equal(emptyText.success, false);

  // Out of bounds safety score (> 100)
  const highSafety = priorityInputSchema.safeParse({
    text: "Water leak",
    safety: 120,
  });
  assert.equal(highSafety.success, false);

  // Negative factor score (< 0)
  const negativeScore = priorityInputSchema.safeParse({
    text: "Water leak",
    urgency: -5,
  });
  assert.equal(negativeScore.success, false);

  // Negative related count
  const negativeCount = priorityInputSchema.safeParse({
    text: "Water leak",
    relatedCount: -1,
  });
  assert.equal(negativeCount.success, false);
});

test("Complaint Candidate Validation: enforces valid status and ISO timestamp", () => {
  const valid = complaintCandidateSchema.safeParse({
    id: "rep-1",
    text: "Garbage pile near park",
    location: { lat: 12.9716, lng: 77.5946 },
    status: "submitted",
    createdAt: new Date().toISOString(),
  });
  assert.equal(valid.success, true);

  // Invalid status
  const invalidStatus = complaintCandidateSchema.safeParse({
    id: "rep-1",
    text: "Garbage pile near park",
    location: { lat: 12.9716, lng: 77.5946 },
    status: "non_existent_status",
    createdAt: new Date().toISOString(),
  });
  assert.equal(invalidStatus.success, false);

  // Invalid createdAt date format
  const invalidDate = complaintCandidateSchema.safeParse({
    id: "rep-1",
    text: "Garbage pile near park",
    location: { lat: 12.9716, lng: 77.5946 },
    status: "submitted",
    createdAt: "not-a-valid-date-string",
  });
  assert.equal(invalidDate.success, false);
});

test("Hotspot Input Validation: requires at least one report", () => {
  const empty = hotspotInputSchema.safeParse({
    reports: [],
  });
  assert.equal(empty.success, false);

  const populated = hotspotInputSchema.safeParse({
    reports: [
      {
        id: "rep-1",
        location: { lat: 12.9716, lng: 77.5946 },
      },
    ],
  });
  assert.equal(populated.success, true);
});

test("Duplicate Check Schema: validates target and candidate array", () => {
  const target = {
    id: "target-1",
    text: "Pothole on street",
    location: { lat: 12.9716, lng: 77.5946 },
    status: "submitted",
    createdAt: new Date().toISOString(),
  };

  const valid = duplicateCheckSchema.safeParse({
    target,
    candidates: [
      {
        id: "cand-1",
        text: "Pothole near corner",
        location: { lat: 12.9718, lng: 77.5948 },
        status: "under_review",
        createdAt: new Date().toISOString(),
      },
    ],
  });
  assert.equal(valid.success, true);
});

