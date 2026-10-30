"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/Badge";
import { ChatMessage, AssistantChatResponse } from "@/types/assistant";
import { CATEGORY_LABELS } from "@/lib/constants";

interface CivicAssistantProps {
  className?: string;
}

const STORAGE_KEY = "civicflow_assistant_messages_v1";

let messageSeq = 0;
function createChatMessage(
  role: "user" | "assistant",
  content: string,
  extra?: Partial<ChatMessage>
): ChatMessage {
  messageSeq += 1;
  return {
    id: `msg_${messageSeq}_${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

export const CivicAssistant: React.FC<CivicAssistantProps> = ({ className }) => {
  const router = useRouter();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>("Groq LLaMA 3.3");
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [confirmingDraft, setConfirmingDraft] = useState<ChatMessage["prefillData"] | null>(null);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate initial welcome message tailored to current user role
  const buildWelcomeMessage = useCallback((): ChatMessage => {
    const greeting = user?.displayName ? `Hello ${user.displayName.split(" ")[0]}!` : "Hello!";

    let content = `${greeting} I am your **CivicFlow AI Assistant**, your guide to municipal civic issue resolution.\n\n`;
    if (user?.role === "officer") {
      content += `As a **Municipal Officer**, you can ask me to explain priority scoring factors, verify duplicate correlations within 150m, or review resolution guidelines.`;
    } else if (user?.role === "admin") {
      content += `As an **Administrator**, you can ask me about platform architecture, 4-stage lifecycle workflows, or municipal SLA triaging.`;
    } else {
      content += `I can help you:\n• **Report issues**: Potholes, waterlogging, waste, drainage, and streetlights\n• **Track complaints**: Inquire about ticket status with your complaint ID\n• **Understand priority**: Learn how safety, urgency, and citizen impact are scored\n• **Choose categories**: Clarify between waterlogging, drainage, or water supply`;
    }

    const defaultSuggested = user?.role === "officer"
      ? [
          "How does duplicate detection work?",
          "Explain the 4 priority factors",
          "What is the Safety Keyword Floor?",
        ]
      : user?.role === "admin"
      ? [
          "Explain the 4 stages of CivicFlow",
          "How is priority calculated?",
          "How does duplicate detection work?",
        ]
      : [
          "How do I report a pothole?",
          "Which category to select for waterlogging?",
          "How is complaint priority calculated?",
          "How does duplicate detection work?",
        ];

    return createChatMessage("assistant", content, {
      source: "groq",
      model: "openai/gpt-oss-120b",
      suggestedQuestions: defaultSuggested,
    });
  }, [user]);

  // Load from session storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
      setMessages([buildWelcomeMessage()]);
    }, 0);

    return () => clearTimeout(timer);
  }, [buildWelcomeMessage]);

  // Save messages to session storage on update
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
      } catch {
        // Storage quota exceeded or disabled
      }
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Focus textarea when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation: Escape key closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Clear conversation handler
  const handleClearChat = () => {
    const freshWelcome = buildWelcomeMessage();
    setMessages([freshWelcome]);
    setConfirmingDraft(null);
    setErrorBanner(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  // Send message to server-side assistant API
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputMessage).trim();
    if (!content || isLoading) return;

    setInputMessage("");
    setErrorBanner(null);

    const userMessage = createChatMessage("user", content);
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const payloadMessages = updatedMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          context: {
            currentPath: typeof window !== "undefined" ? window.location.pathname : undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to communicate with assistant service");
      }

      const assistantPayload: AssistantChatResponse = data.data;

      setIsFallbackMode(assistantPayload.source === "fallback");
      setActiveModel(assistantPayload.source === "groq" ? assistantPayload.model : "Offline Rules Engine");

      const assistantMessage = createChatMessage("assistant", assistantPayload.message, {
        source: assistantPayload.source,
        model: assistantPayload.model,
        complaintData: assistantPayload.complaintData,
        prefillData: assistantPayload.prefillData,
        suggestedQuestions: assistantPayload.suggestedQuestions,
      });

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Assistant communication error";
      setErrorBanner(errMsg);

      const fallbackErrorMessage = createChatMessage(
        "assistant",
        `I encountered an unexpected issue connecting to the AI service. However, our deterministic municipal rules are always active.\n\nYou can ask about:\n• How to report road damage or potholes\n• Distinguishing waterlogging vs drainage\n• Priority calculation rules (Safety 35%, Urgency 25%, Impact 25%, Related 15%)\n• Duplicate correlation rules within 150m`,
        {
          source: "fallback",
          model: "deterministic-rules-v1",
          suggestedQuestions: [
            "How do I report a pothole?",
            "Which category to select for waterlogging?",
            "How is priority calculated?",
          ],
        }
      );
      setMessages((prev) => [...prev, fallbackErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Explicit confirmation submit handler
  const handleConfirmSubmit = async (draft: NonNullable<ChatMessage["prefillData"]>) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsSubmittingDraft(true);
    setErrorBanner(null);

    try {
      const res = await fetch("/api/assistant/submit-confirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: draft.text,
          category: draft.category || "other",
          location: {
            lat: draft.location?.lat || 12.9716,
            lng: draft.location?.lng || 77.5946,
            address: draft.location?.address || "Recorded via CivicFlow AI Assistant",
          },
          explicitlyConfirmed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Submission failed");
      }

      const created = data.data;
      setConfirmingDraft(null);

      const successMessage = createChatMessage(
        "assistant",
        `🎉 **Complaint Submitted Successfully!**\n\nYour complaint has been formally registered with ticket ID **#${created.id}**.\n\n• **Assigned Priority**: ${created.priority.level.toUpperCase()} (${created.priority.score}/100)\n• **Category**: ${created.category.replace(/_/g, " ").toUpperCase()}\n• **Status**: \`${created.status.toUpperCase()}\`\n\nOur municipal triage dispatch has received the report. You can track this ticket anytime from your Citizen Portal.`,
        {
          source: "groq",
          model: activeModel,
          complaintData: {
            id: created.id,
            category: created.category,
            status: created.status,
            priorityLevel: created.priority.level,
            priorityScore: created.priority.score,
            summary: created.summary,
            createdAt: created.createdAt,
            isOwner: true,
          },
          suggestedQuestions: [
            `Status of complaint #${created.id}`,
            "What are the next steps for my report?",
            "Submit another issue",
          ],
        }
      );

      setMessages((prev) => [...prev, successMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit complaint";
      setErrorBanner(msg);
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  // Prefill navigation handler
  const handleNavigateToPrefill = (draft: NonNullable<ChatMessage["prefillData"]>) => {
    const params = new URLSearchParams();
    if (draft.text) params.set("description", draft.text);
    if (draft.category) params.set("category", draft.category);
    if (draft.location?.address) params.set("address", draft.location.address);
    if (draft.location?.lat) params.set("lat", draft.location.lat.toString());
    if (draft.location?.lng) params.set("lng", draft.location.lng.toString());

    setIsOpen(false);
    router.push(`/citizen/submit?${params.toString()}`);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  // Formats bold (**text**) and code (`code`)
  const renderInlineFormatting = (lineText: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = lineText;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code key={keyIdx++} className="px-1 py-0.5 rounded bg-slate-100 text-blue-800 font-mono text-[11px] font-semibold border border-slate-200">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-slate-900">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <Link
            key={keyIdx++}
            href={linkMatch[2]}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            {linkMatch[1]}
          </Link>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      const nextSpecial = remaining.search(/[`*\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  // Markdown-like lightweight renderer for paragraphs, bold text, bullets, and code
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed break-words">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          if (trimmed.startsWith("### ")) {
            return (
              <h4 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 inline-block shrink-0" />
                {trimmed.replace(/^###\s+/, "")}
              </h4>
            );
          }

          if (trimmed.startsWith("> ")) {
            return (
              <div
                key={idx}
                className="my-1.5 pl-2.5 py-1 border-l-2 border-blue-500 bg-blue-50/70 text-slate-700 text-xs rounded-r-md"
              >
                {renderInlineFormatting(trimmed.replace(/^>\s+/, ""))}
              </div>
            );
          }

          if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                <span className="flex-1">{renderInlineFormatting(trimmed.replace(/^[•\-*]\s+/, ""))}</span>
              </div>
            );
          }

          return <p key={idx}>{renderInlineFormatting(trimmed)}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating launcher button */}
      {!isOpen && (
        <div className={cn("fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2", className)}>
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open CivicFlow AI Assistant"
            className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="relative">
              <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-200"></span>
              </span>
            </div>
            <span className="text-xs sm:text-sm font-semibold tracking-wide">
              Civic Assistant
            </span>
          </button>
        </div>
      )}

      {/* Expandable chat panel dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-labelledby="assistant-title"
          aria-modal="true"
          className={cn(
            "fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col bg-white border border-slate-200/90 shadow-2xl rounded-2xl overflow-hidden",
            "w-[calc(100vw-24px)] max-w-[440px] h-[min(650px,calc(100vh-40px))]",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xs shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h3 id="assistant-title" className="text-sm font-bold tracking-tight truncate leading-tight">
                    CivicFlow AI Assistant
                  </h3>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 border",
                      isFallbackMode
                        ? "bg-amber-500/20 text-amber-100 border-amber-300/30"
                        : "bg-emerald-500/20 text-emerald-100 border-emerald-300/30"
                    )}
                    title={isFallbackMode ? "Deterministic Municipal Rules Engine Active" : `AI Model: ${activeModel}`}
                  >
                    {isFallbackMode ? "Rules Mode" : "AI Live"}
                  </span>
                </div>
                <span className="text-[11px] text-blue-100/90 truncate leading-tight mt-0.5">
                  Your guide to civic issue resolution
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={handleClearChat}
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Close Assistant"
                aria-label="Close Assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subheader / Role Context Bar */}
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-medium text-slate-700">Scope:</span>
              <span className="truncate">Municipal Resolution & Tracking</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="capitalize font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md text-[10px]">
                {user ? `${user.role} Desk` : "Guest View"}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorBanner && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span className="truncate">{errorBanner}</span>
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-rose-600 hover:text-rose-900 text-xs font-semibold shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[88%] sm:max-w-[85%]",
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {/* Bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 shadow-2xs text-xs sm:text-[13px]",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs"
                  )}
                >
                  {renderMessageContent(msg.content)}

                  {/* Complaint Data Card if present */}
                  {msg.complaintData && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800">
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                          <span>#{msg.complaintData.id}</span>
                        </div>
                        <Badge
                          variant={msg.complaintData.status}
                          size="sm"
                          showDot
                        >
                          {msg.complaintData.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Priority</span>
                          <span className="font-bold text-slate-700 capitalize">
                            {msg.complaintData.priorityLevel} ({msg.complaintData.priorityScore}/100)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Category</span>
                          <span className="font-medium text-slate-700">
                            {CATEGORY_LABELS[msg.complaintData.category] || msg.complaintData.category}
                          </span>
                        </div>
                      </div>

                      {msg.complaintData.assignedTo && (
                        <div className="text-[11px] pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400">Assigned To: </span>
                          <span className="font-medium text-slate-700">{msg.complaintData.assignedTo}</span>
                        </div>
                      )}

                      {msg.complaintData.resolutionNotes && (
                        <div className="text-[11px] pt-1 text-slate-600 italic">
                          &ldquo;{msg.complaintData.resolutionNotes}&rdquo;
                        </div>
                      )}

                      <div className="pt-1.5 flex justify-end">
                        <Link
                          href={user?.role === "officer" ? "/officer" : "/citizen/complaints"}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                        >
                          <span>Open in Dashboard</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Prefill Draft Card if present */}
                  {msg.prefillData && !confirmingDraft && (
                    <div className="mt-3 p-3 rounded-xl bg-blue-50/80 border border-blue-200/90 text-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                        <span>Complaint Draft Ready</span>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-1">
                        <div>
                          <span className="font-medium text-slate-700">Category: </span>
                          <span className="capitalize">{msg.prefillData.category?.replace(/_/g, " ") || "Other"}</span>
                        </div>
                        {msg.prefillData.location?.address && (
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{msg.prefillData.location.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-1.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleNavigateToPrefill(msg.prefillData!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700 transition-colors shadow-2xs"
                        >
                          <span>Prefill & Review Form</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDraft(msg.prefillData!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-300 text-blue-700 font-semibold text-[11px] hover:bg-blue-50 transition-colors"
                        >
                          <span>Submit via Assistant</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Explicit Confirmation Card */}
                  {confirmingDraft && msg.prefillData === confirmingDraft && (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Explicit Confirmation Required</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-normal">
                        CivicFlow strictly requires explicit citizen confirmation before submitting reports. Do you confirm creating this ticket now?
                      </p>
                      <div className="text-[11px] bg-white/80 p-2 rounded-lg border border-amber-200/80 space-y-1">
                        <div><strong>Category:</strong> {confirmingDraft.category || "other"}</div>
                        <div><strong>Description:</strong> &ldquo;{confirmingDraft.text}&rdquo;</div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isSubmittingDraft}
                          onClick={() => handleConfirmSubmit(confirmingDraft)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {isSubmittingDraft ? (
                            <span>Submitting...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Yes, Confirm & Submit</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingDraft}
                          onClick={() => setConfirmingDraft(null)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata timestamp */}
                <div className="flex items-center gap-1.5 px-1 mt-1 text-[10px] text-slate-400">
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.source && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{msg.source === "groq" ? "AI Verified" : "Rules Engine"}</span>
                    </>
                  )}
                </div>

                {/* Dynamic Suggested Question Chips */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && msg.id === messages[messages.length - 1]?.id && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 w-full">
                    {msg.suggestedQuestions.map((q, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSendMessage(q)}
                        disabled={isLoading}
                        className="text-left text-[11px] px-2.5 py-1 rounded-full bg-white border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-2xs truncate max-w-full"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex flex-col mr-auto items-start max-w-[85%]">
                <div className="rounded-2xl rounded-bl-xs px-3.5 py-3 bg-white border border-slate-200/90 shadow-2xs flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[10px] text-slate-400 px-1 mt-1">Analyzing municipal rules...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200/90 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a question or describe an issue..."
                  rows={1}
                  maxLength={2500}
                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24 min-h-[38px] leading-tight"
                />
                {inputMessage.length > 500 && (
                  <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 bg-white px-1">
                    {inputMessage.length}/2500
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Send message"
                className="h-[38px] w-[38px] rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shadow-2xs shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
