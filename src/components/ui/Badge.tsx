import React from "react";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  type STATUSES,
  type PRIORITY_LEVELS,
} from "@/lib/constants";

export type PriorityVariant = (typeof PRIORITY_LEVELS)[number];
export type StatusVariant = (typeof STATUSES)[number];

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "neutral"
    | "primary"
    | "outline"
    | PriorityVariant
    | StatusVariant;
  size?: "sm" | "md";
  showDot?: boolean;
}

const variantStyles: Record<string, string> = {
  // Neutral / default
  default: "bg-slate-100 text-slate-700 border-slate-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  primary: "bg-blue-50 text-blue-700 border-blue-200",
  outline: "bg-white text-slate-700 border-slate-300",

  // Priority variants
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  high: "bg-amber-50 text-amber-800 border-amber-200",
  medium: "bg-sky-50 text-sky-800 border-sky-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",

  // Status variants (all six statuses)
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-violet-50 text-violet-700 border-violet-200",
  assigned: "bg-cyan-50 text-cyan-800 border-cyan-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const dotColors: Record<string, string> = {
  default: "bg-slate-400",
  neutral: "bg-slate-400",
  primary: "bg-blue-500",
  outline: "bg-slate-400",
  critical: "bg-rose-500",
  high: "bg-amber-500",
  medium: "bg-sky-500",
  low: "bg-slate-400",
  submitted: "bg-blue-500",
  under_review: "bg-violet-500",
  assigned: "bg-cyan-600",
  in_progress: "bg-amber-500",
  resolved: "bg-emerald-500",
  rejected: "bg-rose-500",
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  showDot = false,
  children,
  ...props
}) => {
  // If no children provided, check if variant matches a known status or priority label
  let content = children;
  if (!content) {
    if (variant in STATUS_LABELS) {
      content = STATUS_LABELS[variant as StatusVariant];
    } else if (variant in PRIORITY_LABELS) {
      content = PRIORITY_LABELS[variant as PriorityVariant];
    }
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-md border tracking-wide select-none",
        sizeClasses[size],
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant] || "bg-current"
          )}
          aria-hidden="true"
        />
      )}
      <span>{content}</span>
    </span>
  );
};

Badge.displayName = "Badge";
