"use client";

import type { ButtonHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  color?: string;
}

/** Selectable category chip with a colour dot and a check when selected. */
export function Chip({ selected, color, className, children, type = "button", ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors duration-150 ease-out",
        selected
          ? "border-accent bg-accent-soft text-accent-text"
          : "border-border-strong bg-surface text-fg-2 hover:bg-surface-2 hover:text-fg",
        className,
      )}
      {...rest}
    >
      {color && <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />}
      <span className="truncate">{children}</span>
      {selected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
    </button>
  );
}

export function ColorDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)} style={{ background: color }} />;
}
