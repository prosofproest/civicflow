/**
 * CivicFlow Assistant Core Service Orchestrator
 * 
 * Manages the full conversation pipeline:
 * 1. Request sanitization & history truncation (context window safety).
 * 2. Ground-truth complaint lookup & authorization enforcement.
 * 3. Groq LLM inference with server-side API key protection.
 * 4. Automatic model fallback & deterministic failover when Groq is unavailable, unconfigured, or timing out.
 * 5. Structured action cards (Complaint Summary, Prefill Drafts, Suggestions).
 */

import { User } from "@/types";
import {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantComplaintSummary,
  AssistantPrefillData,
} from "@/types/assistant";
import { buildAssistantSystemPrompt, PromptContext } from "./system-prompt";
import { getDeterministicAssistantResponse, extractComplaintId } from "./fallback";
import { getComplaintById, getComplaints } from "@/lib/services/complaints";
import { CATEGORIES } from "@/lib/constants";

const GROQ_CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TIMEOUT_MS = 8000; // 8-second circuit breaker

/**
 * Derives dynamic suggested questions based on the conversation and user role.
 */
function deriveSuggestedQuestions(
  role: string,
  userQuery: string,
  hasComplaintData: boolean
): string[] {
  const normalized = userQuery.toLowerCase();

  if (hasComplaintData) {
    return [
      "Why was this priority level assigned?",
      "What are the next steps for this ticket?",
      "How do I submit another report?",
    ];
  }

  if (normalized.includes("pothole") || normalized.includes("road")) {
    return [
      "Prefill a pothole complaint",
      "How is road damage priority calculated?",
      "Which category for waterlogged potholes?",
    ];
  }

  if (normalized.includes("water") || normalized.includes("flood")) {
    return [
      "Waterlogging vs drainage category?",
      "How to report a burst water pipe?",
      "What keywords trigger the Safety Floor?",
    ];
  }

  if (role === "officer") {
    return [
      "How does duplicate detection work?",
      "Explain the 4 priority factors",
      "How to resolve a complaint?",
      "What is the Safety Keyword Floor?",
    ];
  }

  if (role === "admin") {
    return [
      "Platform 4-stage lifecycle overview",
      "How is duplicate confidence computed?",
      "Priority engine threshold configuration",
    ];
  }

  // Default citizen questions
  return [
    "How do I report a pothole?",
    "Which category to select for waterlogging?",
    "How is complaint priority calculated?",
    "How does duplicate detection work?",
  ];
}

/**
 * Extracts prefill suggestions if the assistant or user discussed drafting an issue.
 */
function detectPrefillFromContent(
  content: string,
  userQuery: string
): AssistantPrefillData | undefined {
  const combined = `${userQuery} ${content}`.toLowerCase();

  const isReporting =
    combined.includes("report") ||
    combined.includes("submit") ||
    combined.includes("draft") ||
    combined.includes("pothole") ||
    combined.includes("broken") ||
    combined.includes("waterlog");

  if (!isReporting) return undefined;

  let category: AssistantPrefillData["category"] = "other";
  for (const cat of CATEGORIES) {
    if (combined.includes(cat.replace(/_/g, " ")) || combined.includes(cat)) {
      category = cat;
      break;
    }
  }

  if (category === "other") {
    if (combined.includes("pothole") || combined.includes("road") || combined.includes("asphalt")) {
      category = "road_damage";
    } else if (combined.includes("flood") || combined.includes("waterlog") || combined.includes("standing water")) {
      category = "waterlogging";
    } else if (combined.includes("drain") || combined.includes("sewage") || combined.includes("manhole")) {
      category = "drainage";
    } else if (combined.includes("garbage") || combined.includes("waste") || combined.includes("trash")) {
      category = "waste";
    } else if (combined.includes("light") || combined.includes("lamp")) {
      category = "streetlight";
    }
  }

  return {
    text: userQuery.length >= 10 ? userQuery : `Report regarding ${category.replace(/_/g, " ")}`,
    category,
  };
}

/**
 * Executes a single Groq request with timeout control.
 */
async function callGroqChat(
  apiKey: string,
  model: string,
  systemPrompt: string,
  recentMessages: Array<{ role: string; content: string }>
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages,
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Groq API returned HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    const replyContent = payload.choices?.[0]?.message?.content?.trim();

    if (!replyContent) {
      throw new Error("Empty completion returned from Groq");
    }

    return replyContent;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Processes an incoming assistant chat request.
 */
export async function processAssistantChat(
  request: AssistantChatRequest,
  user: User | null
): Promise<AssistantChatResponse> {
  const messages = request.messages || [];

  if (messages.length === 0) {
    return {
      ok: false,
      message: "Please enter a question or describe your civic issue.",
      source: "fallback",
      model: "deterministic-rules-v1",
    };
  }

  const latestUserMessage = messages[messages.length - 1];
  const queryText = latestUserMessage?.content || "";

  // 1. Validation & sanitization
  if (!queryText.trim()) {
    return {
      ok: false,
      message: "Please provide a non-empty message.",
      source: "fallback",
      model: "deterministic-rules-v1",
    };
  }

  if (queryText.length > 2500) {
    return {
      ok: false,
      message: "Your message is too long (limit: 2,500 characters). Please provide a concise summary.",
      source: "fallback",
      model: "deterministic-rules-v1",
    };
  }

  // 2. Resolve verified complaint ground truth & permissions
  const targetComplaintId = extractComplaintId(queryText) || request.context?.selectedComplaintId;
  let verifiedComplaint: AssistantComplaintSummary | null = null;
  let unauthorizedAttempt: { complaintId: string; reason: string } | null = null;

  if (targetComplaintId) {
    const rawComplaint = await getComplaintById(targetComplaintId);
    if (rawComplaint) {
      if (!user) {
        unauthorizedAttempt = {
          complaintId: targetComplaintId,
          reason: "User is unauthenticated. Private complaint data is strictly hidden until sign-in.",
        };
      } else {
        const isOwner = rawComplaint.reporterUid === user.uid;
        const isOfficerOrAdmin = user.role === "officer" || user.role === "admin";

        if (!isOwner && !isOfficerOrAdmin) {
          unauthorizedAttempt = {
            complaintId: targetComplaintId,
            reason: `Complaint #${targetComplaintId} was reported by another citizen (${rawComplaint.reporterUid}) and cannot be accessed by user (${user.uid}).`,
          };
        } else {
          verifiedComplaint = {
            id: rawComplaint.id,
            category: rawComplaint.category,
            status: rawComplaint.status,
            priorityLevel: rawComplaint.priority.level,
            priorityScore: rawComplaint.priority.score,
            summary: rawComplaint.summary,
            createdAt: rawComplaint.createdAt,
            assignedTo: rawComplaint.assignedTo,
            resolutionNotes: rawComplaint.resolutionNotes,
            isOwner,
          };
        }
      }
    }
  }

  // 3. User's recent complaints if authenticated
  let userRecentComplaints: AssistantComplaintSummary[] | undefined;
  if (user && (queryText.toLowerCase().includes("my complaints") || queryText.toLowerCase().includes("my tickets"))) {
    const userComplaints = await getComplaints({ reporterUid: user.uid, limit: 5 });
    userRecentComplaints = userComplaints.map((c) => ({
      id: c.id,
      category: c.category,
      status: c.status,
      priorityLevel: c.priority.level,
      priorityScore: c.priority.score,
      summary: c.summary,
      createdAt: c.createdAt,
      assignedTo: c.assignedTo,
      resolutionNotes: c.resolutionNotes,
      isOwner: true,
    }));
  }

  // 4. Check if Groq is configured
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return await getDeterministicAssistantResponse(queryText, user);
  }

  // Models to attempt: preferred model, then known stable models
  const configuredModel = process.env.GROQ_MODEL?.trim();
  const candidateModels = [
    configuredModel,
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
  ].filter(Boolean) as string[];

  // Deduplicate candidates preserving order
  const modelsToTry = Array.from(new Set(candidateModels));

  // 5. Attempt Groq Completion with automated model failover
  const promptContext: PromptContext = {
    user,
    currentPath: request.context?.currentPath,
    verifiedComplaint,
    unauthorizedComplaintAttempt: unauthorizedAttempt || undefined,
    userRecentComplaints,
  };

  const systemPrompt = buildAssistantSystemPrompt(promptContext);
  const recentMessages = messages.slice(-8).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 1500),
  }));

  for (const model of modelsToTry) {
    try {
      const replyContent = await callGroqChat(apiKey, model, systemPrompt, recentMessages);
      const prefillData = detectPrefillFromContent(replyContent, queryText);
      const suggestedQuestions = deriveSuggestedQuestions(
        user?.role || "citizen",
        queryText,
        !!verifiedComplaint
      );

      return {
        ok: true,
        message: replyContent,
        source: "groq",
        model,
        complaintData: verifiedComplaint || undefined,
        prefillData,
        suggestedQuestions,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Model request failed";
      console.warn(`Groq request for model ${model} failed (${errMsg}).`);
      // Continue to next candidate model
    }
  }

  // 6. Graceful Failover to Deterministic Engine if all Groq models fail
  console.warn("All Groq model attempts exhausted or timed out. Serving deterministic municipal rules.");
  const fallbackResponse = await getDeterministicAssistantResponse(queryText, user);
  return {
    ...fallbackResponse,
    source: "fallback",
    model: "deterministic-rules-v1",
    complaintData: verifiedComplaint || fallbackResponse.complaintData,
  };
}
