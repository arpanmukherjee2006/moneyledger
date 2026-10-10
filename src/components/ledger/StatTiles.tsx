import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import type { Totals } from "@/lib/calc";
import { percentChange } from "@/lib/calc";
import { formatPaise, MINUS } from "@/lib/money";
import { monthLabel, monthShortLabel } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";
import { Amount } from "./Amount";

/** The one number the dashboard leads with. */
export function BalanceHero({ balance, entryCount, mode }: { balance: number; entryCount: number; mode: "local" | "cloud" }) {
  return (
    <section
      aria-labelledby="balance-heading"
      className="rounded-lg border border-border bg-surface px-5 py-6 shadow-card sm:px-8 sm:py-8"
    >
      <h1 id="balance-heading" className="text-sm font-medium text-fg-2">
        Total balance
      </h1>
      <p className={cn("num mt-1 text-2xl font-semibold tracking-tight sm:text-3xl", balance < 0 ? "text-out-text" : "text-fg")}>
        {formatPaise(balance)}
      </p>
      <p className="mt-2 text-sm text-fg-3">
        All money added minus all money withdrawn, across {entryCount} {entryCount === 1 ? "entry" : "entries"}.
        {mode === "local" ? " Stored in this browser." : " Synced to your account."}
      </p>
    </section>
  );
}

interface MonthCardsProps {
  month: string;
  current: Totals;
  previous: Totals;
}

/** Added, withdrawn and net for the selected month, each with change versus the previous month. */
export function MonthCards({ month, current, previous }: MonthCardsProps) {
  const prevLabel = monthShortLabel(prevMonthKey(month));
  const tiles = [
    { key: "added", label: "Added", icon: ArrowDownLeft, value: current.added, prev: previous.added, tone: "in" as const },
    { key: "withdrawn", label: "Withdrawn", icon: ArrowUpRight, value: current.withdrawn, prev: previous.withdrawn, tone: "out" as const },
    { key: "net", label: "Net", icon: Scale, value: current.net, prev: previous.net, tone: "net" as const },
  ];
  return (
    <section aria-label={`Totals for ${monthLabel(month)}`} className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {tiles.map((t) => {
        const change = percentChange(t.value, t.prev);
        const Icon = t.icon;
        return (
          <Card key={t.key} className="px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-fg-2">{t.label}</span>
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  t.tone === "in" ? "bg-in-soft text-in-text" : t.tone === "out" ? "bg-out-soft text-out-text" : "bg-accent-soft text-accent-text",
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </div>
            <p className="mt-2 whitespace-nowrap text-lg font-semibold tracking-tight lg:text-xl">
              {t.tone === "net" ? (
                <Amount paise={t.value} signed />
              ) : (
                <span className={cn("num whitespace-nowrap", t.tone === "in" ? "text-in-text" : "text-out-text")}>
                  {t.tone === "in" ? "+" : MINUS}
                  {formatPaise(t.value)}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-fg-3">
              {change === null
                ? t.prev === 0 && t.value === 0
                  ? `Nothing in ${prevLabel} either`
                  : `Nothing in ${prevLabel}`
                : (
                    <>
                      {`${change > 0 ? "+" : change < 0 ? MINUS : ""}${Math.abs(change).toFixed(0)}% vs ${prevLabel} `}
                      <span className="num whitespace-nowrap">({formatPaise(t.prev, { sign: t.tone === "net" ? "always" : "never" })})</span>
                    </>
                  )}
            </p>
          </Card>
        );
      })}
    </section>
  );
}

function prevMonthKey(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) - 1;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}
