import type { CategoryShare } from "@/lib/calc";
import type { EntryType } from "@/lib/types";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/cn";

interface Props {
  rows: CategoryShare[];
  type: EntryType;
  total: number;
}

/** Horizontal bars by category. Each row carries its number so colour is never the only signal. */
export function CategoryBreakdown({ rows, type, total }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-fg-3">No {type === "in" ? "money added" : "money withdrawn"} this month.</p>;
  }
  return (
    <ul className="flex flex-col gap-3" aria-label={`${type === "in" ? "Added" : "Withdrawn"} by category`}>
      {rows.map((r) => (
        <li key={r.categoryId ?? "none"}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-fg">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
              <span className="truncate">{r.name}</span>
              <span className="shrink-0 text-xs text-fg-3">
                {r.count} {r.count === 1 ? "entry" : "entries"}
              </span>
            </span>
            <span className="num shrink-0 text-fg">
              {formatPaise(r.amount)}
              <span className="ml-2 text-xs text-fg-3">{(r.share * 100).toFixed(0)}%</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div
              className={cn("h-full rounded-full", type === "in" ? "bg-in" : "bg-out")}
              style={{ width: `${Math.max(2, r.share * 100)}%` }}
            />
          </div>
        </li>
      ))}
      <li className="flex justify-between border-t border-border pt-2 text-sm font-semibold text-fg">
        <span>Total</span>
        <span className="num">{formatPaise(total)}</span>
      </li>
    </ul>
  );
}
