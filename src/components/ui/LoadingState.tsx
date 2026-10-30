import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = "Loading data...",
  description,
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "py-6 gap-2",
    md: "py-12 gap-3",
    lg: "py-20 gap-4",
  };

  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-slate-200 bg-white p-6 shadow-xs",
        sizeClasses[size],
        className
      )}
    >
      <Loader2
        className={cn("animate-spin text-blue-600", iconSizes[size])}
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {description && (
          <p className="text-xs text-slate-500 max-w-sm">{description}</p>
        )}
      </div>
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};

LoadingState.displayName = "LoadingState";
