import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePriority,
  detectSafetyHazard,
  calculateRelatedScore,
  SAFETY_FLOOR_FACTOR_SCORE,
  SAFETY_FLOOR_FINAL_SCORE,
} from "../src/lib/engine/priority";
import { PRIORITY_WEIGHTS } from "../src/lib/constants";

test("Priority Weights sum strictly to 1.0", () => {
  const sum =
    PRIORITY_WEIGHTS.safety +
    PRIORITY_WEIGHTS.urgency +
    PRIORITY_WEIGHTS.impact +
    PRIORITY_WEIGHTS.related;
  assert.equal(Number(sum.toFixed(2)), 1.0);
  assert.equal(PRIORITY_WEIGHTS.safety, 0.35);
  assert.equal(PRIORITY_WEIGHTS.urgency, 0.25);
  assert.equal(PRIORITY_WEIGHTS.impact, 0.25);
  assert.equal(PRIORITY_WEIGHTS.related, 0.15);
});

test("Priority Calculation: exact deterministic scores and factor contributions", () => {
  // Safety: 40 (contrib: 14.0)
  // Urgency: 60 (contrib: 15.0)
  // Impact: 80 (contrib: 20.0)
  // Related: 2 reports -> 50 (contrib: 7.5)
  // Sum = 14 + 15 + 20 + 7.5 = 56.5 -> round to 57 (High)
  const result = calculatePriority({
    text: "Pothole on 5th Avenue causing minor vehicle delay",
    safety: 40,
    urgency: 60,
    impact: 80,
    relatedCount: 2,
  });

  assert.equal(result.score, 57);
  assert.equal(result.level, "high");
  assert.equal(result.safetyFloorApplied, false);
  assert.equal(result.factors.length, 4);

  const safetyFactor = result.factors.find((f) => f.key === "safety");
  assert.equal(safetyFactor?.input, 40);
  assert.equal(safetyFactor?.weight, 0.35);
  assert.equal(safetyFactor?.contribution, 14);

  const urgencyFactor = result.factors.find((f) => f.key === "urgency");
  assert.equal(urgencyFactor?.input, 60);
  assert.equal(urgencyFactor?.weight, 0.25);
  assert.equal(urgencyFactor?.contribution, 15);

  const impactFactor = result.factors.find((f) => f.key === "impact");
  assert.equal(impactFactor?.input, 80);
  assert.equal(impactFactor?.weight, 0.25);
  assert.equal(impactFactor?.contribution, 20);

  const relatedFactor = result.factors.find((f) => f.key === "related");
  assert.equal(relatedFactor?.input, 50);
  assert.equal(relatedFactor?.weight, 0.15);
  assert.equal(relatedFactor?.contribution, 7.5);
});

test("Priority Thresholds: Critical (>=75), High (>=55), Medium (>=35), Low (<35)", () => {
  // Critical
  const critical = calculatePriority({
    text: "Major infrastructure disruption",
    safety: 90,
    urgency: 85,
    impact: 80,
    relatedCount: 4,
  });
  assert.ok(critical.score >= 75);
  assert.equal(critical.level, "critical");

  // High
  const high = calculatePriority({
    text: "Moderate pipe leak",
    safety: 60,
    urgency: 60,
    impact: 60,
    relatedCount: 2,
  });
  assert.ok(high.score >= 55 && high.score < 75);
  assert.equal(high.level, "high");

  // Medium
  const medium = calculatePriority({
    text: "Streetlight flickering",
    safety: 40,
    urgency: 40,
    impact: 40,
    relatedCount: 1,
  });
  assert.ok(medium.score >= 35 && medium.score < 55);
  assert.equal(medium.level, "medium");

  // Low
  const low = calculatePriority({
    text: "Minor trash on side curb",
    safety: 10,
    urgency: 10,
    impact: 10,
    relatedCount: 0,
  });
  assert.ok(low.score < 35);
  assert.equal(low.level, "low");
});

test("Safety Floor Rule: Enforces minimum safety factor and final score for immediate hazards", () => {
  // Even if user provides low scores (e.g. 10/100) and related count is 0,
  // a live electrical wire must trigger the safety floor!
  const hazardResult = calculatePriority({
    text: "Dangerous live wire sparking near pedestrian crossing",
    safety: 15,
    urgency: 20,
    impact: 10,
    relatedCount: 0,
  });

  assert.equal(hazardResult.safetyFloorApplied, true);
  assert.equal(hazardResult.matchedHazardKeyword, "live wire");

  // Safety factor input elevated to at least 85
  const safetyFactor = hazardResult.factors.find((f) => f.key === "safety");
  assert.ok(safetyFactor!.input >= SAFETY_FLOOR_FACTOR_SCORE);

  // Final score floored to at least 75 (Critical)
  assert.ok(hazardResult.score >= SAFETY_FLOOR_FINAL_SCORE);
  assert.equal(hazardResult.level, "critical");

  // Explanation documents the safety floor enforcement
  assert.ok(hazardResult.explanation.includes("SAFETY FLOOR ENFORCED"));
  assert.ok(hazardResult.explanation.includes("live wire"));
});

test("Safety Floor Detection: Multiple hazard keywords check", () => {
  assert.equal(detectSafetyHazard("Gas leak reported near school"), "gas leak");
  assert.equal(detectSafetyHazard("Open manhole on cycling track"), "open manhole");
  assert.equal(detectSafetyHazard("Building collapse warning after storm"), "building collapse");
  assert.equal(detectSafetyHazard("Deep sinkhole opening up on roadway"), "sinkhole");
  assert.equal(detectSafetyHazard("Graffiti on city hall wall"), null);
});

test("Related Score scaling: 0->0, 1->25, 2->50, 3->75, 4+->100", () => {
  assert.equal(calculateRelatedScore(0), 0);
  assert.equal(calculateRelatedScore(1), 25);
  assert.equal(calculateRelatedScore(2), 50);
  assert.equal(calculateRelatedScore(3), 75);
  assert.equal(calculateRelatedScore(4), 100);
  assert.equal(calculateRelatedScore(10), 100);
});
