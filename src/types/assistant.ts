import { Category, PriorityLevel, Status } from "./index";

export interface AssistantComplaintSummary {
  id: string;
  category: Category;
  status: Status;
  priorityLevel: PriorityLevel;
  priorityScore: number;
  summary: string;
  createdAt: string;
  assignedTo?: string;
  resolutionNotes?: string;
  isOwner?: boolean;
}

export interface AssistantPrefillData {
  text: string;
  category?: Category;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  source?: "groq" | "fallback";
  model?: string;
  complaintData?: AssistantComplaintSummary;
  prefillData?: AssistantPrefillData;
  suggestedQuestions?: string[];
  requiresConfirmation?: boolean;
  confirmationPayload?: {
    text: string;
    category: Category;
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface AssistantChatRequest {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  context?: {
    currentPath?: string;
    selectedComplaintId?: string;
  };
}

export interface AssistantChatResponse {
  ok: boolean;
  message: string;
  source: "groq" | "fallback";
  model: string;
  complaintData?: AssistantComplaintSummary;
  prefillData?: AssistantPrefillData;
  suggestedQuestions?: string[];
  confirmationPayload?: ChatMessage["confirmationPayload"];
  error?: string;
}
