import React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 sm:p-12 transition-colors",
        className
      )}
    >
      <div className="rounded-full bg-white p-3 text-slate-500 shadow-xs border border-slate-200 mb-3">
        {icon || <Inbox className="h-6 w-6 text-slate-400" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

EmptyState.displayName = "EmptyState";
