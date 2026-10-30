/**
 * CivicFlow Groq AI Integration & Deterministic Failover Pipeline
 * 
 * Capabilities:
 * 1. Categorization into the 8 canonical categories
 * 2. Concise complaint summary generation (1-2 sentences)
 * 3. Explainable factor score extraction: Safety (0-100), Urgency (0-100), Impact (0-100)
 * 4. Action brief generation for municipal response teams
 * 
 * Strict Architecture Rule:
 * AI output factor scores are fed INTO the deterministic Priority Engine from Phase 2.
 * AI NEVER directly sets the final priority score or priority level.
 * 
 * Robust Failover:
 * If GROQ_API_KEY is missing, request times out, or response is malformed,
 * the engine automatically invokes the deterministic rule-based fallback.
 * Complaint submission NEVER crashes due to external AI unavailability.
 */

import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";
import { Category } from "@/types";
import { detectSafetyHazard } from "@/lib/engine/priority";

export interface AiComplaintAnalysis {
  category: Category;
  summary: string;
  safety: number;
  urgency: number;
  impact: number;
  actionBrief: string;
}

export interface AiProcessingResult {
  analysis: AiComplaintAnalysis;
  aiMeta: {
    status: "ok" | "fallback";
    model: string;
    durationMs: number;
    error?: string;
  };
}

const aiAnalysisSchema = z.object({
  category: z.enum(CATEGORIES),
  summary: z.string().min(5).max(300),
  safety: z.number().min(0).max(100),
  urgency: z.number().min(0).max(100),
  impact: z.number().min(0).max(100),
  actionBrief: z.string().min(10).max(500),
});

/**
 * Keyword-to-category mapping for deterministic fallback analysis.
 */
const CATEGORY_KEYWORD_MAP: Array<{ category: Category; keywords: string[] }> = [
  {
    category: "public_safety",
    keywords: ["wire", "hazard", "gas", "collapse", "fire", "danger", "electric", "spark", "explosion", "sinkhole"],
  },
  {
    category: "water_supply",
    keywords: ["drinking water", "water supply", "pipe burst", "no water", "low pressure", "contaminated water", "tap water"],
  },
  {
    category: "waterlogging",
    keywords: ["flood", "waterlog", "submerged", "inundated", "standing water", "overflowing road"],
  },
  {
    category: "drainage",
    keywords: ["drain", "sewage", "gutter", "culvert", "clogged drain", "storm drain", "manhole overflow"],
  },
  {
    category: "road_damage",
    keywords: ["pothole", "crater", "asphalt", "road", "tar", "pavement", "caved in", "uneven road"],
  },
  {
    category: "waste",
    keywords: ["garbage", "trash", "waste", "dump", "debris", "litter", "rubbish", "overflowing bin"],
  },
  {
    category: "streetlight",
    keywords: ["streetlight", "lamp post", "street light", "dark road", "light bulb", "no light", "flickering light"],
  },
];

/**
 * Deterministic rule-based fallback analysis when Groq is unavailable or unconfigured.
 */
export function getDeterministicFallbackAnalysis(
  text: string,
  userSelectedCategory?: Category
): AiComplaintAnalysis {
  const normalizedText = text.toLowerCase();
  const matchedHazard = detectSafetyHazard(text);

  // 1. Determine category
  let detectedCategory: Category = userSelectedCategory || "other";
  if (!userSelectedCategory || userSelectedCategory === "other") {
    for (const mapping of CATEGORY_KEYWORD_MAP) {
      if (mapping.keywords.some((kw) => normalizedText.includes(kw))) {
        detectedCategory = mapping.category;
        break;
      }
    }
  }

  // 2. Derive factor scores
  let safety = 40;
  let urgency = 40;
  let impact = 45;

  if (matchedHazard) {
    safety = 85;
    urgency = 80;
    impact = 70;
  } else {
    switch (detectedCategory) {
      case "public_safety":
        safety = 75;
        urgency = 70;
        impact = 60;
        break;
      case "waterlogging":
        safety = 65;
        urgency = 70;
        impact = 75;
        break;
      case "drainage":
        safety = 55;
        urgency = 60;
        impact = 65;
        break;
      case "road_damage":
        safety = 60;
        urgency = 50;
        impact = 55;
        break;
      case "water_supply":
        safety = 50;
        urgency = 65;
        impact = 75;
        break;
      case "waste":
        safety = 35;
        urgency = 40;
        impact = 45;
        break;
      case "streetlight":
        safety = 45;
        urgency = 35;
        impact = 40;
        break;
      default:
        safety = 35;
        urgency = 35;
        impact = 35;
        break;
    }
  }

  // Length or severity modifiers
  if (normalizedText.includes("hospital") || normalizedText.includes("school") || normalizedText.includes("main road")) {
    impact = Math.min(100, impact + 20);
    urgency = Math.min(100, urgency + 15);
  }

  // 3. Generate concise summary
  const trimmedText = text.trim();
  const firstSentence = trimmedText.split(/[.!?]\s+/)[0] || trimmedText;
  const summary = firstSentence.length > 150
    ? `${firstSentence.slice(0, 147)}...`
    : firstSentence;

  // 4. Generate action brief
  const actionBrief = matchedHazard
    ? `URGENT ACTION: Immediate hazard (${matchedHazard}) identified. Dispatch emergency inspection and secure perimeter.`
    : `Standard departmental dispatch recommended for ${detectedCategory.replace(/_/g, " ")}. Verify site conditions and schedule remediation.`;

  return {
    category: detectedCategory,
    summary,
    safety,
    urgency,
    impact,
    actionBrief,
  };
}

/**
 * Executes AI complaint analysis via Groq with deterministic failover.
 */
export async function analyzeComplaintWithAi(
  text: string,
  userSelectedCategory?: Category
): Promise<AiProcessingResult> {
  const startTime = Date.now();
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

  // If Groq is unconfigured, return deterministic fallback immediately
  if (!apiKey) {
    const analysis = getDeterministicFallbackAnalysis(text, userSelectedCategory);
    return {
      analysis,
      aiMeta: {
        status: "fallback",
        model: "deterministic-rules-v1",
        durationMs: Date.now() - startTime,
        error: "GROQ_API_KEY is not configured",
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8-second circuit breaker

    const systemPrompt = `You are CivicFlow's Municipal AI Processing Agent.
Analyze the citizen's civic complaint text and output ONLY a strictly valid JSON object.
Allowed categories: ${CATEGORIES.join(", ")}.

Your JSON response MUST match this exact schema:
{
  "category": "<one of the allowed categories>",
  "summary": "<concise 1-2 sentence description summary, max 200 chars>",
  "safety": <integer 0-100 indicating immediate public safety risk>,
  "urgency": <integer 0-100 indicating municipal response time sensitivity>,
  "impact": <integer 0-100 indicating community and pedestrian scale of disruption>,
  "actionBrief": "<clear operational recommendation for field dispatchers, max 300 chars>"
}

Do not include markdown blocks, preamble, or commentary. Output pure JSON only.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `User selected category: ${userSelectedCategory || "none"}\nComplaint description: "${text}"`,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Groq API returned HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    const rawContent = payload.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("Empty completion from Groq API");
    }

    const parsedJson = JSON.parse(rawContent);
    const validated = aiAnalysisSchema.safeParse(parsedJson);

    if (!validated.success) {
      throw new Error(`Schema validation failed on AI output: ${validated.error.message}`);
    }

    return {
      analysis: validated.data,
      aiMeta: {
        status: "ok",
        model,
        durationMs: Date.now() - startTime,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "AI analysis request failed";
    const analysis = getDeterministicFallbackAnalysis(text, userSelectedCategory);

    return {
      analysis,
      aiMeta: {
        status: "fallback",
        model: "deterministic-rules-v1",
        durationMs: Date.now() - startTime,
        error: errorMsg,
      },
    };
  }
}
