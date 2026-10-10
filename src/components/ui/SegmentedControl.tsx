"use client";

import { cn } from "@/lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  tone?: "in" | "out" | "neutral";
}

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  label: string;
  className?: string;
  size?: "md" | "lg";
}

/** Radio-group style switch, e.g. Added / Withdrawn. */
export function SegmentedControl<T extends string>({ value, onChange, options, label, className, size = "md" }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid rounded-sm bg-surface-2 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      onKeyDown={(e) => {
        const i = options.findIndex((o) => o.value === value);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(options[(i + 1) % options.length].value);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(options[(i - 1 + options.length) % options.length].value);
        }
      }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        const tone =
          o.tone === "in" ? "text-in-text" : o.tone === "out" ? "text-out-text" : "text-fg";
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[6px] font-medium transition-[background-color,color,box-shadow] duration-150 ease-out",
              size === "lg" ? "h-11 text-base" : "h-9 text-sm",
              selected ? cn("bg-surface shadow-card", tone) : "text-fg-2 hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
