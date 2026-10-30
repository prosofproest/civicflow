/**
 * CivicFlow Deterministic Priority Scoring Engine
 * 
 * Implements a 4-factor deterministic scoring model:
 * 1. Public Safety Score (35%, weight: 0.35)
 * 2. Response Urgency Score (25%, weight: 0.25)
 * 3. Community Impact Score (25%, weight: 0.25)
 * 4. Related Reports Score (15%, weight: 0.15)
 * 
 * Total weights strictly sum to 1.0 (0.35 + 0.25 + 0.25 + 0.15 = 1.00).
 * 
 * Priority Levels:
 * - Critical: score >= 75
 * - High:     55 <= score < 75
 * - Medium:   35 <= score < 55
 * - Low:      score < 35
 * 
 * Safety Keyword Floor Rule:
 * Obvious immediate public hazards (e.g., live electric wires, gas leaks, structural collapse, open manholes)
 * must NEVER receive an artificially low priority due to low report counts or low initial impact assessments.
 * When an immediate hazard keyword is detected in the complaint text:
 * - The Safety factor input is automatically elevated to a minimum of 85/100.
 * - The final Priority score is guaranteed a minimum floor of 75/100 (Critical level).
 * - The exact keyword match and floor adjustment are documented in the human-readable explanation.
 */

import { PRIORITY_WEIGHTS, getPriorityLevel } from "../constants";
import { Priority, PriorityFactor, PriorityLevel, Category } from "../../types";
import { PriorityInput } from "../validation/engine";

/**
 * Standard immediate hazard keywords triggering the Safety Keyword Floor.
 */
export const SAFETY_HAZARD_KEYWORDS = [
  "live wire",
  "exposed wire",
  "sparking wire",
  "downed power line",
  "gas leak",
  "chemical spill",
  "structural collapse",
  "building collapse",
  "bridge crack",
  "bridge collapse",
  "sinkhole",
  "open manhole",
  "manhole collapse",
  "transformer explosion",
  "explosion hazard",
  "active fire",
  "fire hazard",
  "electrocution",
  "sewage overflow inside",
  "water main burst",
  "landslide",
  "fallen tree on power lines",
] as const;

export const SAFETY_FLOOR_FACTOR_SCORE = 85;
export const SAFETY_FLOOR_FINAL_SCORE = 75;

/**
 * Default factor scores by category if not explicitly provided.
 */
export const CATEGORY_DEFAULT_SCORES: Record<
  Category,
  { safety: number; urgency: number; impact: number }
> = {
  public_safety: { safety: 85, urgency: 75, impact: 65 },
  waterlogging: { safety: 65, urgency: 70, impact: 75 },
  drainage: { safety: 50, urgency: 55, impact: 60 },
  water_supply: { safety: 45, urgency: 65, impact: 75 },
  road_damage: { safety: 60, urgency: 50, impact: 55 },
  waste: { safety: 35, urgency: 40, impact: 45 },
  streetlight: { safety: 45, urgency: 35, impact: 40 },
  other: { safety: 30, urgency: 30, impact: 30 },
};

export interface PriorityCalculationResult extends Priority {
  safetyFloorApplied: boolean;
  matchedHazardKeyword?: string;
  normalizedScore: number;
}

/**
 * Detects whether the complaint text contains any immediate safety hazards.
 */
export function detectSafetyHazard(text: string): string | null {
  const normalizedText = text.toLowerCase();
  for (const keyword of SAFETY_HAZARD_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}

/**
 * Calculates the related reports score (0 to 100) based on citizen confirmation counts.
 * Scaled: 0 -> 0, 1 -> 25, 2 -> 50, 3 -> 75, 4+ -> 100.
 */
export function calculateRelatedScore(relatedCount: number): number {
  if (relatedCount <= 0) return 0;
  return Math.min(100, Math.round(relatedCount * 25));
}

/**
 * Deterministic Priority Engine computation function.
 */
export function calculatePriority(input: PriorityInput): PriorityCalculationResult {
  const text = input.text || "";
  const matchedKeyword = detectSafetyHazard(text);
  const categoryDefaults = input.category ? CATEGORY_DEFAULT_SCORES[input.category] : null;

  // 1. Raw factor resolution
  let safetyInput = input.safety ?? categoryDefaults?.safety ?? 40;
  const urgencyInput = input.urgency ?? categoryDefaults?.urgency ?? 40;
  const impactInput = input.impact ?? categoryDefaults?.impact ?? 40;
  const relatedInput = calculateRelatedScore(input.relatedCount || 0);

  // 2. Safety Floor Application
  let safetyFloorApplied = false;
  if (matchedKeyword) {
    if (safetyInput < SAFETY_FLOOR_FACTOR_SCORE) {
      safetyInput = SAFETY_FLOOR_FACTOR_SCORE;
      safetyFloorApplied = true;
    }
  }

  // Bound all factor inputs strictly between 0 and 100
  const clampedSafety = Math.max(0, Math.min(100, safetyInput));
  const clampedUrgency = Math.max(0, Math.min(100, urgencyInput));
  const clampedImpact = Math.max(0, Math.min(100, impactInput));
  const clampedRelated = Math.max(0, Math.min(100, relatedInput));

  // 3. Compute factor contributions
  // Weights: safety=0.35, urgency=0.25, impact=0.25, related=0.15 (sum = 1.00)
  const safetyWeight = PRIORITY_WEIGHTS.safety;
  const urgencyWeight = PRIORITY_WEIGHTS.urgency;
  const impactWeight = PRIORITY_WEIGHTS.impact;
  const relatedWeight = PRIORITY_WEIGHTS.related;

  const safetyContribution = Number((clampedSafety * safetyWeight).toFixed(2));
  const urgencyContribution = Number((clampedUrgency * urgencyWeight).toFixed(2));
  const impactContribution = Number((clampedImpact * impactWeight).toFixed(2));
  const relatedContribution = Number((clampedRelated * relatedWeight).toFixed(2));

  // Raw weighted sum
  const rawSum = safetyContribution + urgencyContribution + impactContribution + relatedContribution;
  let finalScore = Math.round(rawSum);

  // Apply final score floor if immediate hazard was detected
  if (matchedKeyword && finalScore < SAFETY_FLOOR_FINAL_SCORE) {
    finalScore = SAFETY_FLOOR_FINAL_SCORE;
    safetyFloorApplied = true;
  }

  // Ensure normalized 0-100 range
  finalScore = Math.max(0, Math.min(100, finalScore));
  const level: PriorityLevel = getPriorityLevel(finalScore);

  const factors: PriorityFactor[] = [
    {
      key: "safety",
      label: "Public Safety",
      input: clampedSafety,
      weight: safetyWeight,
      contribution: safetyContribution,
    },
    {
      key: "urgency",
      label: "Response Urgency",
      input: clampedUrgency,
      weight: urgencyWeight,
      contribution: urgencyContribution,
    },
    {
      key: "impact",
      label: "Community Impact",
      input: clampedImpact,
      weight: impactWeight,
      contribution: impactContribution,
    },
    {
      key: "related",
      label: "Related Reports",
      input: clampedRelated,
      weight: relatedWeight,
      contribution: relatedContribution,
    },
  ];

  // 4. Construct human-readable explanation
  let explanation = `Priority score calculated as ${finalScore}/100 (${level.toUpperCase()}). `;
  if (safetyFloorApplied && matchedKeyword) {
    explanation += `[SAFETY FLOOR ENFORCED: Critical hazard keyword "${matchedKeyword}" detected; safety score floored at ${SAFETY_FLOOR_FACTOR_SCORE} and final score elevated to minimum ${SAFETY_FLOOR_FINAL_SCORE}]. `;
  }
  explanation += `Weighted breakdown: Safety (${clampedSafety} × 35% = ${safetyContribution}), Urgency (${clampedUrgency} × 25% = ${urgencyContribution}), Impact (${clampedImpact} × 25% = ${impactContribution}), Related Reports (${clampedRelated} × 15% = ${relatedContribution}, count: ${input.relatedCount || 0}).`;

  return {
    score: finalScore,
    normalizedScore: finalScore,
    level,
    factors,
    explanation,
    safetyFloorApplied,
    matchedHazardKeyword: matchedKeyword || undefined,
  };
}
