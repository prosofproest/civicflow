import React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  badge?: React.ReactNode;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  title,
  description,
  action,
  align = "left",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b border-slate-200/80 mb-6",
        align === "center" && "text-center md:flex-col md:items-center",
        className
      )}
    >
      <div className={cn("space-y-1.5", align === "center" && "max-w-2xl mx-auto")}>
        {badge && <div className="mb-2">{badge}</div>}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {description && (
          <p className="text-sm sm:text-base text-slate-500 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};

SectionHeader.displayName = "SectionHeader";
