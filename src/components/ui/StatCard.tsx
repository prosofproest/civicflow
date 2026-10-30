import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  helperText?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  badge?: React.ReactNode;
  isSample?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  helperText,
  icon,
  trend,
  trendValue,
  badge,
  isSample = true,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {label}
            </span>
            {isSample && (
              <span className="inline-flex items-center rounded-sm bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-500 border border-slate-200">
                Sample data
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            {value}
          </div>
        </div>

        {icon && (
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 border border-blue-100 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(helperText || trend || badge) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            {trend === "up" && (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                {trendValue}
              </span>
            )}
            {trend === "down" && (
              <span className="inline-flex items-center gap-0.5 text-rose-600 font-medium">
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                {trendValue}
              </span>
            )}
            {trend === "neutral" && (
              <span className="inline-flex items-center gap-0.5 text-slate-500 font-medium">
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                {trendValue}
              </span>
            )}
            {helperText && <span className="text-slate-500">{helperText}</span>}
          </div>

          {badge && <div>{badge}</div>}
        </div>
      )}
    </div>
  );
};

StatCard.displayName = "StatCard";
