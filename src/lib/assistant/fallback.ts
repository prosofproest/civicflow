/**
 * CivicFlow Deterministic Fallback Assistant Engine
 * 
 * Provides robust, accurate, and completely deterministic responses when Groq is unavailable,
 * rate-limited, unconfigured, or experiencing network timeouts.
 * 
 * Guarantees:
 * 1. 100% operational for municipal guidance, categories, priority formula, and duplicate rules.
 * 2. Authenticated complaint lookup directly from backend data (no fabricated data).
 * 3. Enforces strict privacy and RBAC permissions.
 * 4. Transparently marks responses with source: "fallback" and model: "deterministic-rules-v1".
 */

import {
  CATEGORY_GUIDES,
  CIVICFLOW_LIFECYCLE_STAGES,
  STATUS_DESCRIPTIONS,
} from "./knowledge";
import { User, Category } from "@/types";
import { AssistantChatResponse, AssistantComplaintSummary, AssistantPrefillData } from "@/types/assistant";
import { getComplaintById, getComplaints } from "@/lib/services/complaints";
import { CATEGORIES } from "@/lib/constants";
import { detectSafetyHazard } from "@/lib/engine/priority";

/**
 * Extracts a complaint ID from user query text if present (e.g. complaint_12345, #complaint_12345, or mock IDs).
 */
export function extractComplaintId(text: string): string | null {
  // 1. Canonical CivicFlow ID prefixes: complaint_*, rep_*, c_*
  const canonicalMatch =
    text.match(/(?:#|\b)(complaint_[a-zA-Z0-9_-]+)/i) ||
    text.match(/(?:#|\b)(rep_[a-zA-Z0-9_-]+)/i) ||
    text.match(/(?:#|\b)(c_\d+_[a-z0-9]+)/i);

  if (canonicalMatch) return canonicalMatch[1];

  // 2. Explicit hashtag identifier: #<id>
  const hashMatch = text.match(/#([a-zA-Z0-9_-]{4,})/);
  if (hashMatch) {
    const candidate = hashMatch[1];
    const reservedWords = ["priority", "status", "category", "complaint", "help", "stage", "stages", "hazard"];
    if (!reservedWords.includes(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // 3. Explicit keywords: "complaint id: 12345", "ticket #12345"
  const explicitMatch =
    text.match(/(?:complaint\s+id\s*(?:is|:|=)?\s*#?\s*)([a-zA-Z0-9_-]{4,})/i) ||
    text.match(/(?:ticket\s+(?:id\s*)?(?:is|:|=)?\s*#?\s*)([a-zA-Z0-9_-]{4,})/i);

  if (explicitMatch) {
    const candidate = explicitMatch[1];
    const reservedWords = ["priority", "status", "category", "number", "here", "details", "level", "score"];
    if (!reservedWords.includes(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return null;
}

/**
 * Checks if a query is clearly outside CivicFlow's civic scope.
 */
function isOutOfScopeQuery(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  const offTopicKeywords = [
    "capital of",
    "write a poem",
    "tell me a joke",
    "recipe for",
    "who is the president",
    "weather tomorrow",
    "stock price",
    "crypto",
    "bitcoin",
    "movie recommendation",
    "translate to spanish",
    "write code in python",
    "who won the match",
    "football score",
    "song lyrics",
  ];
  return offTopicKeywords.some((kw) => normalized.includes(kw));
}

/**
 * Helper to extract potential complaint submission intent from conversational text.
 */
function extractComplaintDraft(text: string): AssistantPrefillData | null {
  const normalized = text.toLowerCase();
  const submissionTriggers = ["i want to report", "report a", "complaint about", "there is a", "there is an", "broken", "pothole on", "garbage at", "waterlogging at"];
  const hasTrigger = submissionTriggers.some((t) => normalized.includes(t));

  if (!hasTrigger && text.length < 20) return null;

  // Detect category from text
  let category: Category = "other";
  if (normalized.includes("pothole") || normalized.includes("road") || normalized.includes("crater") || normalized.includes("asphalt")) {
    category = "road_damage";
  } else if (normalized.includes("flood") || normalized.includes("waterlog") || normalized.includes("submerged") || normalized.includes("standing water")) {
    category = "waterlogging";
  } else if (normalized.includes("drain") || normalized.includes("sewage") || normalized.includes("culvert") || normalized.includes("gutter")) {
    category = "drainage";
  } else if (normalized.includes("waste") || normalized.includes("garbage") || normalized.includes("trash") || normalized.includes("debris")) {
    category = "waste";
  } else if (normalized.includes("streetlight") || normalized.includes("lamp") || normalized.includes("street light") || normalized.includes("dark road")) {
    category = "streetlight";
  } else if (normalized.includes("drinking water") || normalized.includes("pipe burst") || normalized.includes("water supply")) {
    category = "water_supply";
  } else if (detectSafetyHazard(text) || normalized.includes("live wire") || normalized.includes("gas leak") || normalized.includes("open manhole")) {
    category = "public_safety";
  }

  // Look for location mentions like "at ...", "on ...", "near ..."
  let extractedAddress: string | undefined;
  const addressMatch = text.match(/(?:at|on|near|in front of)\s+([A-Za-z0-9\s,.-]{4,40})(?:\.|$|,)/i);
  if (addressMatch) {
    extractedAddress = addressMatch[1].trim();
  }

  return {
    text: text.trim(),
    category,
    location: extractedAddress ? { address: extractedAddress } : undefined,
  };
}

/**
 * Main deterministic responder.
 */
export async function getDeterministicAssistantResponse(
  userQuery: string,
  user: User | null
): Promise<AssistantChatResponse> {
  const trimmed = userQuery.trim();
  const normalized = trimmed.toLowerCase();

  // 1. Check for empty or excessively long query
  if (!trimmed) {
    return {
      ok: false,
      message: "Please enter a question or describe the civic issue you need assistance with.",
      source: "fallback",
      model: "deterministic-rules-v1",
    };
  }

  if (trimmed.length > 2000) {
    return {
      ok: false,
      message: "Your message is too long (exceeds 2,000 characters). Please provide a concise description of your civic inquiry.",
      source: "fallback",
      model: "deterministic-rules-v1",
    };
  }

  // 2. Off-topic & out-of-scope queries
  if (isOutOfScopeQuery(normalized)) {
    return {
      ok: true,
      message: `I am the **CivicFlow AI Assistant**, specifically designed to assist with municipal civic issue resolution in your city.\n\nMy capabilities include:\n• Guiding complaint reporting for potholes, waterlogging, waste, drainage, and streetlights\n• Explaining the 4-factor priority calculation and safety hazard floors\n• Explaining duplicate detection policies\n• Tracking your authenticated complaints\n\nI am unable to answer general knowledge or unrelated questions. How can I assist you with a civic matter today?`,
      source: "fallback",
      model: "deterministic-rules-v1",
      suggestedQuestions: [
        "How do I report a pothole?",
        "Which category to select for waterlogging?",
        "How is priority calculated?",
        "Explain the 4 stages of CivicFlow",
      ],
    };
  }

  // 3. Complaint tracking & status lookup
  const detectedComplaintId = extractComplaintId(trimmed);
  const isAskingForOwnComplaints =
    normalized.includes("my complaints") ||
    normalized.includes("my reports") ||
    normalized.includes("my issues") ||
    normalized.includes("what complaints have i submitted") ||
    normalized.includes("status of my complaints");

  if (detectedComplaintId) {
    const complaint = await getComplaintById(detectedComplaintId);

    if (!complaint) {
      return {
        ok: true,
        message: `I could not find any complaint matching ID **#${detectedComplaintId}** in the CivicFlow system. Please verify the ID from your confirmation email or citizen portal.`,
        source: "fallback",
        model: "deterministic-rules-v1",
        suggestedQuestions: ["How do I check my complaints?", "How do I submit a new complaint?"],
      };
    }

    // Role-based authorization check
    if (!user) {
      return {
        ok: true,
        message: `Complaint **#${detectedComplaintId}** exists, but full status details are protected for citizen privacy.\n\nPlease **sign in** to your CivicFlow account to verify ownership and view complete dispatch details.`,
        source: "fallback",
        model: "deterministic-rules-v1",
        suggestedQuestions: ["Where do I sign in?", "How do I report a new issue?"],
      };
    }

    const isOwner = complaint.reporterUid === user.uid;
    const isOfficerOrAdmin = user.role === "officer" || user.role === "admin";

    if (!isOwner && !isOfficerOrAdmin) {
      return {
        ok: true,
        message: `**Access Restricted**: Complaint **#${detectedComplaintId}** was submitted by another citizen. In accordance with CivicFlow's strict privacy policy, citizens can only view and track their own submitted reports.`,
        source: "fallback",
        model: "deterministic-rules-v1",
        suggestedQuestions: ["Show my complaints", "How do I report a new issue?"],
      };
    }

    // Verified data formatting
    const statusInfo = STATUS_DESCRIPTIONS[complaint.status];
    const complaintSummary: AssistantComplaintSummary = {
      id: complaint.id,
      category: complaint.category,
      status: complaint.status,
      priorityLevel: complaint.priority.level,
      priorityScore: complaint.priority.score,
      summary: complaint.summary,
      createdAt: complaint.createdAt,
      assignedTo: complaint.assignedTo,
      resolutionNotes: complaint.resolutionNotes,
      isOwner,
    };

    let reply = `Here are the verified details for complaint **#${complaint.id}**:\n\n`;
    reply += `• **Status**: \`${complaint.status.toUpperCase()}\` — ${statusInfo.description}\n`;
    reply += `• **Category**: ${complaint.category.replace(/_/g, " ").toUpperCase()}\n`;
    reply += `• **Priority**: **${complaint.priority.level.toUpperCase()}** (${complaint.priority.score}/100)\n`;
    reply += `• **Summary**: ${complaint.summary}\n`;
    reply += `• **Submitted**: ${new Date(complaint.createdAt).toLocaleDateString()} at ${new Date(complaint.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n`;

    if (complaint.assignedTo) {
      reply += `• **Assigned Officer**: ${complaint.assignedTo}\n`;
    }
    if (complaint.resolutionNotes) {
      reply += `• **Resolution Notes**: "${complaint.resolutionNotes}"\n`;
    }

    reply += `\n**Next Steps**: ${statusInfo.nextSteps}`;

    return {
      ok: true,
      message: reply,
      source: "fallback",
      model: "deterministic-rules-v1",
      complaintData: complaintSummary,
      suggestedQuestions: [
        `Why was complaint #${complaint.id} scored as ${complaint.priority.level}?`,
        "What does this status mean?",
        "How do I submit another report?",
      ],
    };
  }

  // 4. Listing user's own complaints
  if (isAskingForOwnComplaints) {
    if (!user) {
      return {
        ok: true,
        message: `To view your submitted complaints, please **sign in** to CivicFlow. Once logged in, I can retrieve the live status of all your active and resolved tickets.`,
        source: "fallback",
        model: "deterministic-rules-v1",
        suggestedQuestions: ["How do I register?", "How to report a pothole?"],
      };
    }

    const ownComplaints = await getComplaints({ reporterUid: user.uid, limit: 5 });

    if (ownComplaints.length === 0) {
      return {
        ok: true,
        message: `You have not submitted any complaints yet under this account (${user.email}). Would you like me to guide you through submitting your first civic report?`,
        source: "fallback",
        model: "deterministic-rules-v1",
        suggestedQuestions: ["How do I report a pothole?", "What information is needed to submit a complaint?"],
      };
    }

    let reply = `Found **${ownComplaints.length}** recent complaint(s) submitted by you:\n\n`;
    for (const c of ownComplaints) {
      reply += `• **#${c.id}** [${c.status.toUpperCase()}]: ${c.summary} (Priority: ${c.priority.level.toUpperCase()} - ${c.priority.score}/100)\n`;
    }
    reply += `\nYou can ask me: *"What is the status of complaint #${ownComplaints[0].id}?"* for in-depth dispatch details.`;

    return {
      ok: true,
      message: reply,
      source: "fallback",
      model: "deterministic-rules-v1",
      suggestedQuestions: [
        `Status of complaint #${ownComplaints[0].id}`,
        "How is priority calculated?",
        "Submit a new complaint",
      ],
    };
  }

  // 5. How to report a pothole / road damage
  if (
    normalized.includes("pothole") ||
    (normalized.includes("report") && normalized.includes("road"))
  ) {
    return {
      ok: true,
      message: `### How to Report Road Damage or Potholes in CivicFlow\n\n` +
        `1. **Category Selection**: Choose **Road Damage** (\`road_damage\`).\n` +
        `2. **Precise Location**: Use the "Use My Current GPS Location" button or type the exact street/crossroad and landmark.\n` +
        `3. **Clear Description**: Describe the size, depth, and whether it disrupts traffic or endangers two-wheelers (minimum 10 characters).\n` +
        `4. **Photo Evidence**: Upload a clear photograph showing the defect and surroundings to assist field crews.\n` +
        `5. **Explicit Review & Submission**: Review the calculated priority and click **Submit Complaint**.\n\n` +
        `> **Safety Tip**: If an immediate structural collapse or deep sinkhole is present, mention it clearly — CivicFlow will automatically elevate the incident to **Critical Priority** via our Safety Keyword Floor.\n\n` +
        `Would you like to start drafting a road damage complaint right now?`,
      source: "fallback",
      model: "deterministic-rules-v1",
      prefillData: {
        text: trimmed.length >= 15 && !normalized.startsWith("how")
          ? trimmed
          : "Pothole on the road causing traffic hazard and risk to motorists",
        category: "road_damage",
      },
      suggestedQuestions: [
        "Prefill a pothole complaint",
        "How is road damage priority calculated?",
        "What if water has flooded the pothole?",
      ],
    };
  }

  // 6. Which category to select for waterlogging / drainage / water supply
  if (
    normalized.includes("waterlog") ||
    normalized.includes("flood") ||
    (normalized.includes("category") && normalized.includes("water"))
  ) {
    return {
      ok: true,
      message: `### Category Guide: Waterlogging vs. Drainage vs. Water Supply\n\n` +
        `Citizens often ask how to distinguish water-related issues. Here is how to select the right category:\n\n` +
        `1. **Waterlogging** (\`waterlogging\`):\n` +
        `   • Select when **surface rainwater or standing water** floods roads, intersections, or pedestrian walkways.\n` +
        `   • *Example*: "Road underpass submerged under 2 feet of water after rainfall."\n\n` +
        `2. **Drainage & Sewage** (\`drainage\`):\n` +
        `   • Select when the problem is an **overflowing sewer manhole, choked storm drain, or foul-smelling wastewater leak**.\n` +
        `   • *Example*: "Sewage manhole overflowing on 4th Main with foul black water."\n\n` +
        `3. **Water Supply** (\`water_supply\`):\n` +
        `   • Select when there is a burst in a **potable drinking water pipeline**, low supply pressure, or contaminated tap water.\n` +
        `   • *Example*: "Clean municipal water main burst gushing water across the pavement."\n\n` +
        `Which of these matches the issue you are observing?`,
      source: "fallback",
      model: "deterministic-rules-v1",
      suggestedQuestions: [
        "How do I report waterlogging?",
        "How do I report a drainage issue?",
        "How does CivicFlow prioritize waterlogging?",
      ],
    };
  }

  // 7. General category selection assistance
  if (
    normalized.includes("which category") ||
    normalized.includes("what category") ||
    normalized.includes("choose category") ||
    normalized.includes("categories")
  ) {
    let reply = `### CivicFlow Issue Categories\n\nCivicFlow supports 8 canonical categories. Here is a quick reference:\n\n`;
    for (const cat of CATEGORIES) {
      const g = CATEGORY_GUIDES[cat];
      reply += `• **${g.title}** (\`${cat}\`): ${g.description}\n`;
    }
    reply += `\nTell me about the problem you are experiencing, and I will recommend the best category and prefill the form for you!`;

    return {
      ok: true,
      message: reply,
      source: "fallback",
      model: "deterministic-rules-v1",
      suggestedQuestions: [
        "Which category for a broken streetlight?",
        "Which category for uncollected garbage?",
        "Which category for an open manhole?",
      ],
    };
  }

  // 8. How priority is calculated & Safety Floor
  if (
    normalized.includes("priority") ||
    normalized.includes("score calculated") ||
    normalized.includes("how is priority") ||
    normalized.includes("safety floor")
  ) {
    return {
      ok: true,
      message: `### How CivicFlow Calculates Incident Priority\n\n` +
        `CivicFlow uses a **deterministic, transparent 4-factor scoring engine** (summing strictly to 100%):\n\n` +
        `1. **Public Safety (35% weight)**: Assesses physical danger or bodily hazard to citizens.\n` +
        `2. **Response Urgency (25% weight)**: Evaluates rate of degradation and municipal time sensitivity.\n` +
        `3. **Community Impact (25% weight)**: Measures pedestrian, vehicular, and community disruption scale.\n` +
        `4. **Related Reports (15% weight)**: Boosted by crowdsourced confirmation (0 reports = 0%, 1 = 25%, 2 = 50%, 3 = 75%, 4+ = 100%).\n\n` +
        `**Priority Thresholds**:\n` +
        `• **Critical**: Score ≥ 75\n` +
        `• **High**: 55 ≤ Score < 75\n` +
        `• **Medium**: 35 ≤ Score < 55\n` +
        `• **Low**: Score < 35\n\n` +
        `🛡️ **The Safety Keyword Floor Rule**:\n` +
        `When immediate life-threatening hazards are detected in the complaint text (e.g. *live wire, gas leak, open manhole, structural collapse*), the Safety factor is automatically floored at **85/100** and the final incident priority is guaranteed to be **Critical (≥75)** regardless of report count.`,
      source: "fallback",
      model: "deterministic-rules-v1",
      suggestedQuestions: [
        "What keywords trigger the Safety Floor?",
        "How does duplicate detection work?",
        "How do I report a live wire?",
      ],
    };
  }

  // 9. How duplicate detection works
  if (
    normalized.includes("duplicate") ||
    normalized.includes("deduplication") ||
    normalized.includes("same issue")
  ) {
    return {
      ok: true,
      message: `### How CivicFlow Duplicate Detection Works\n\n` +
        `CivicFlow automatically correlates multiple citizen reports of the same incident using a multi-factor mathematical model:\n\n` +
        `1. **Spatial Proximity (Haversine Distance)**: Compares coordinates; complaints must be within **150 metres** of each other.\n` +
        `2. **Temporal Window**: Compares unresolved complaints filed within the last **30 days**.\n` +
        `3. **Lexical Similarity (Jaccard)**: Compares word token overlap between the two complaint descriptions.\n` +
        `4. **Unified Confidence Formula**:\n` +
        `   \`Confidence = (Text Similarity × 60%) + (Proximity Score × 40%)\`\n` +
        `   Incidents meeting or exceeding **60% (0.60)** confidence are linked.\n\n` +
        `🔒 **CivicFlow's Core Preservation Policy**:\n` +
        `CivicFlow **NEVER automatically deletes or merges complaints**. Every citizen's original report is preserved in the system. Duplicate reports reinforce each other by increasing the **Related Reports count**, which elevates the incident's priority for faster municipal action!`,
      source: "fallback",
      model: "deterministic-rules-v1",
      suggestedQuestions: [
        "How does priority scoring work?",
        "Can officers see duplicate reports?",
        "How do I submit a complaint?",
      ],
    };
  }

  // 10. The four stages: Capture, Understand, Reveal, Act
  if (
    normalized.includes("four stages") ||
    normalized.includes("4 stages") ||
    normalized.includes("capture understand reveal act") ||
    normalized.includes("lifecycle") ||
    normalized.includes("how civicflow works")
  ) {
    let reply = `### The 4 Stages of CivicFlow\n\nCivicFlow transforms chaotic municipal complaints into structured, transparent action through 4 key stages:\n\n`;
    for (const s of CIVICFLOW_LIFECYCLE_STAGES) {
      reply += `**Stage ${s.stage}: ${s.name} (${s.title})**\n${s.description}\n\n`;
    }
    reply += `Would you like more details on how Citizens or Municipal Officers interact with these stages?`;

    return {
      ok: true,
      message: reply,
      source: "fallback",
      model: "deterministic-rules-v1",
      suggestedQuestions: [
        "How do officers use CivicFlow?",
        "How do citizens track complaints?",
        "How is priority calculated?",
      ],
    };
  }

  // 11. Streetlight reporting guidance
  if (normalized.includes("streetlight") || normalized.includes("street light") || normalized.includes("dark street")) {
    return {
      ok: true,
      message: `### How to Report Streetlight Issues in CivicFlow\n\n` +
        `• **Category**: Select **Streetlight** (\`streetlight\`).\n` +
        `• **What to Include**:\n` +
        `  1. Exact pole number (usually painted in yellow on the metal pole) or nearest house address.\n` +
        `  2. Specific issue: light completely off, flickering, broken glass, or hanging fixture.\n` +
        `  3. Mention if the darkness creates safety risks for pedestrians or motorists.\n\n` +
        `⚠️ **Safety Note**: If electrical wires are hanging low or sparking near the ground, report as **Public Safety** (\`public_safety\`) for immediate emergency response.`,
      source: "fallback",
      model: "deterministic-rules-v1",
      prefillData: {
        text: trimmed.length >= 15 && !normalized.startsWith("how")
          ? trimmed
          : "Streetlight not working on street, creating dark hazard at night",
        category: "streetlight",
      },
      suggestedQuestions: ["Prefill streetlight complaint", "How long does repair take?"],
    };
  }

  // 12. Waste management reporting guidance
  if (normalized.includes("waste") || normalized.includes("garbage") || normalized.includes("trash") || normalized.includes("dump")) {
    return {
      ok: true,
      message: `### How to Report Waste & Garbage Issues\n\n` +
        `• **Category**: Select **Waste Management** (\`waste\`).\n` +
        `• **What to Include**:\n` +
        `  1. Location of overflowing bin, illegal dump site, or debris.\n` +
        `  2. Nature of waste: household waste, plastic, construction debris, or commercial waste.\n` +
        `  3. Duration: how many days the garbage has remained uncollected.\n` +
        `  4. Photo: a clear picture showing the volume helps dispatch appropriate sanitation trucks.`,
      source: "fallback",
      model: "deterministic-rules-v1",
      prefillData: {
        text: trimmed.length >= 15 && !normalized.startsWith("how")
          ? trimmed
          : "Overflowing garbage dump on roadside attracting pests and blocking pedestrian path",
        category: "waste",
      },
      suggestedQuestions: ["Prefill garbage report", "How is waste priority scored?"],
    };
  }

  // 13. Conversational complaint draft detection
  const potentialDraft = extractComplaintDraft(trimmed);
  if (potentialDraft && trimmed.length >= 15) {
    const catLabel = potentialDraft.category ? CATEGORY_GUIDES[potentialDraft.category].title : "Civic Issue";
    return {
      ok: true,
      message: `I have prepared a complaint draft for you based on your description:\n\n` +
        `• **Category**: ${catLabel}\n` +
        `• **Description**: "${potentialDraft.text}"\n` +
        (potentialDraft.location?.address ? `• **Detected Location**: ${potentialDraft.location.address}\n` : "") +
        `\nYou can click **Prefill Complaint Form** below to review all details, attach a photo, and verify your coordinates before submitting!`,
      source: "fallback",
      model: "deterministic-rules-v1",
      prefillData: potentialDraft,
      suggestedQuestions: [
        "Prefill Complaint Form",
        "Change category",
        "How is this priority calculated?",
      ],
    };
  }

  // 14. Default fallback guidance
  return {
    ok: true,
    message: `Hello! I am your **CivicFlow AI Assistant**.\n\n` +
      `I can help you with:\n` +
      `• **Reporting issues**: Potholes, waterlogging, waste, drainage, streetlights, or safety hazards.\n` +
      `• **Tracking complaints**: Ask for status using your complaint ID (e.g. *#complaint_...*).\n` +
      `• **Understanding priority**: Learn how our 4-factor scoring and Safety Keyword Floor work.\n` +
      `• **Category advice**: Clarify whether to report as waterlogging, drainage, or water supply.\n\n` +
      `What civic issue or question can I assist you with today?`,
    source: "fallback",
    model: "deterministic-rules-v1",
    suggestedQuestions: [
      "How do I report a pothole?",
      "Which category to select for waterlogging?",
      "How is complaint priority calculated?",
      "How does duplicate detection work?",
    ],
  };
}
