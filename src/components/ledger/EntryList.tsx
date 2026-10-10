"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import type { Category, Entry } from "@/lib/types";
import { relativeDateLabel } from "@/lib/dates";
import { sortNewestFirst } from "@/lib/calc";
import { cn } from "@/lib/cn";
import { useQuickAdd } from "@/components/providers/QuickAddProvider";
import { useLedger } from "@/components/providers/LedgerProvider";
import { Amount } from "./Amount";

interface EntryListProps {
  entries: Entry[];
  categories: Category[];
  /** Group rows under date headings. */
  grouped?: boolean;
  className?: string;
}

export function EntryList({ entries, categories, grouped = true, className }: EntryListProps) {
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const sorted = useMemo(() => sortNewestFirst(entries), [entries]);

  if (!grouped) {
    return (
      <ul className={cn("divide-y divide-border", className)}>
        {sorted.map((e) => (
          <EntryRow key={e.id} entry={e} category={e.categoryId ? byId.get(e.categoryId) : undefined} showDate />
        ))}
      </ul>
    );
  }

  const groups: { date: string; items: Entry[] }[] = [];
  for (const e of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === e.date) last.items.push(e);
    else groups.push({ date: e.date, items: [e] });
  }

  return (
    <div className={className}>
      {groups.map((g) => (
        <section key={g.date} aria-label={relativeDateLabel(g.date)}>
          <h3 className="sticky top-0 z-10 bg-surface-2 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-fg-3 sm:px-6">
            {relativeDateLabel(g.date)}
          </h3>
          <ul className="divide-y divide-border">
            {g.items.map((e) => (
              <EntryRow key={e.id} entry={e} category={e.categoryId ? byId.get(e.categoryId) : undefined} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const SWIPE_WIDTH = 128;

function EntryRow({ entry, category, showDate }: { entry: Entry; category?: Category; showDate?: boolean }) {
  const { open } = useQuickAdd();
  const { deleteEntry } = useLedger();
  const [offset, setOffset] = useState(0);
  const drag = useRef<{ x: number; y: number; active: boolean; horizontal: boolean | null } | null>(null);
  const revealed = offset <= -SWIPE_WIDTH + 8;

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "touch") return;
    drag.current = { x: e.clientX, y: e.clientY, active: true, horizontal: null };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d?.active) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.horizontal === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!d.horizontal) {
        d.active = false;
        return;
      }
    }
    const base = revealed ? -SWIPE_WIDTH : 0;
    setOffset(Math.max(-SWIPE_WIDTH, Math.min(0, base + dx)));
  }
  function onPointerEnd() {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setOffset(offset < -SWIPE_WIDTH / 2 ? -SWIPE_WIDTH : 0);
  }

  const Icon = entry.type === "in" ? ArrowDownLeft : ArrowUpRight;

  return (
    <li className="relative overflow-hidden">
      {/* Swipe actions (touch only). Keyboard and mouse users have the same actions in the edit sheet. */}
      <div className="absolute inset-y-0 right-0 flex sm:hidden" aria-hidden={!revealed}>
        <button
          type="button"
          tabIndex={revealed ? 0 : -1}
          onClick={() => {
            setOffset(0);
            open(entry);
          }}
          className="flex w-16 items-center justify-center bg-surface-3 text-fg"
          aria-label="Edit entry"
        >
          <Pencil className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          tabIndex={revealed ? 0 : -1}
          onClick={() => {
            setOffset(0);
            deleteEntry(entry.id);
          }}
          className="flex w-16 items-center justify-center bg-danger text-white"
          aria-label="Delete entry"
        >
          <Trash2 className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div
        className="relative bg-surface transition-transform duration-150 ease-out"
        style={{ transform: `translateX(${offset}px)`, touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <button
          type="button"
          onClick={() => (revealed ? setOffset(0) : open(entry))}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2 sm:px-6"
          aria-label={`Edit ${entry.type === "in" ? "added" : "withdrawn"} entry${category ? `, ${category.name}` : ""}`}
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              entry.type === "in" ? "bg-in-soft text-in-text" : "bg-out-soft text-out-text",
            )}
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-medium text-fg">
              {category && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: category.color }} />}
              <span className="truncate">{category?.name ?? (entry.type === "in" ? "Added" : "Withdrawn")}</span>
            </span>
            <span className="mt-0.5 block truncate text-xs text-fg-3">
              {showDate && <span>{relativeDateLabel(entry.date)}</span>}
              {showDate && entry.note && <span aria-hidden> · </span>}
              {entry.note || (!showDate ? (category ? (entry.type === "in" ? "Added" : "Withdrawn") : "No note") : "")}
            </span>
          </span>
          <Amount paise={entry.amount} type={entry.type} className="shrink-0 text-sm font-semibold" />
        </button>
      </div>
    </li>
  );
}
