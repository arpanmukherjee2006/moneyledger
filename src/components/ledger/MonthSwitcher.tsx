"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, currentMonthKey, monthLabel } from "@/lib/dates";
import { IconButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface Props {
  value: string;
  onChange: (month: string) => void;
  className?: string;
}

export function MonthSwitcher({ value, onChange, className }: Props) {
  const current = currentMonthKey();
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <IconButton label="Previous month" variant="secondary" size="sm" onClick={() => onChange(addMonths(value, -1))}>
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </IconButton>
      <div className="min-w-[9.5rem] text-center whitespace-nowrap">
        <span className="text-sm font-semibold text-fg" aria-live="polite">
          {monthLabel(value)}
        </span>
        {value !== current && (
          <button
            type="button"
            onClick={() => onChange(current)}
            className="ml-2 text-xs font-medium text-accent-text hover:underline"
          >
            Current month
          </button>
        )}
      </div>
      <IconButton label="Next month" variant="secondary" size="sm" onClick={() => onChange(addMonths(value, 1))}>
        <ChevronRight className="h-5 w-5" aria-hidden />
      </IconButton>
    </div>
  );
}
