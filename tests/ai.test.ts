import test from "node:test";
import assert from "node:assert/strict";
import {
  getDeterministicFallbackAnalysis,
  analyzeComplaintWithAi,
} from "../src/lib/ai/groq";

test("AI Fallback: accurately categorizes text based on municipal keywords", () => {
  const roadReport = getDeterministicFallbackAnalysis("Massive pothole crater on main street");
  assert.equal(roadReport.category, "road_damage");

  const waterReport = getDeterministicFallbackAnalysis("Drinking water pipe burst flooding road");
  assert.equal(waterReport.category, "water_supply");

  const lightReport = getDeterministicFallbackAnalysis("Dark corner with broken streetlight lamp post");
  assert.equal(lightReport.category, "streetlight");

  const wasteReport = getDeterministicFallbackAnalysis("Garbage dump overflowing on sidewalk");
  assert.equal(wasteReport.category, "waste");
});

test("AI Fallback: elevates factor scores and generates emergency action brief for hazards", () => {
  const hazardReport = getDeterministicFallbackAnalysis(
    "Dangerous live wire sparking on ground near school bus stand"
  );
  assert.equal(hazardReport.category, "public_safety");
  assert.ok(hazardReport.safety >= 85);
  assert.ok(hazardReport.urgency >= 80);
  assert.ok(hazardReport.actionBrief.includes("URGENT ACTION"));
  assert.ok(hazardReport.actionBrief.includes("live wire"));
});

test("AI Pipeline: executes graceful failover when GROQ_API_KEY is not set", async () => {
  const originalKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;

  const result = await analyzeComplaintWithAi(
    "Open drain overflowing into street after heavy rain",
    "drainage"
  );

  assert.equal(result.aiMeta.status, "fallback");
  assert.ok(result.aiMeta.model.includes("deterministic"));
  assert.equal(result.analysis.category, "drainage");
  assert.ok(result.analysis.summary.length > 5);
  assert.ok(typeof result.analysis.safety === "number");
  assert.ok(typeof result.analysis.urgency === "number");
  assert.ok(typeof result.analysis.impact === "number");

  if (originalKey) {
    process.env.GROQ_API_KEY = originalKey;
  }
});
