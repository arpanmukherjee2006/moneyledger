"use client";

import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  items: TabItem<T>[];
  label: string;
  className?: string;
}

export function Tabs<T extends string>({ value, onChange, items, label, className }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 border-b border-border", className)}>
      {items.map((t) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => {
              const i = items.findIndex((x) => x.value === value);
              if (e.key === "ArrowRight") onChange(items[(i + 1) % items.length].value);
              if (e.key === "ArrowLeft") onChange(items[(i - 1 + items.length) % items.length].value);
            }}
            className={cn(
              "-mb-px h-11 border-b-2 px-3 text-sm font-medium transition-colors duration-150 ease-out",
              selected ? "border-accent text-fg" : "border-transparent text-fg-3 hover:text-fg",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
