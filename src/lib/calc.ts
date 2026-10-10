import type { Category, Entry, EntryType } from "./types";
import { addMonths, currentMonthKey, makeMonthKey, monthKeyOf, monthRange, yearOf } from "./dates";

/**
 * Every total in the app is derived here from the entry list. Nothing is stored
 * separately, so reports can never drift from the data.
 */

export interface Totals {
  added: number;
  withdrawn: number;
  net: number;
  count: number;
}

export interface MonthRow extends Totals {
  month: string;
  runningBalance: number;
}

export interface CategoryShare {
  categoryId: string | null;
  name: string;
  color: string;
  amount: number;
  count: number;
  /** 0..1 share of its type's total for the period */
  share: number;
}

export interface YearSummary {
  year: number;
  months: MonthRow[];
  totals: Totals;
  bestMonth: string | null;
  worstMonth: string | null;
}

export const EMPTY_TOTALS: Totals = { added: 0, withdrawn: 0, net: 0, count: 0 };

export function sumTotals(entries: Iterable<Entry>): Totals {
  let added = 0;
  let withdrawn = 0;
  let count = 0;
  for (const e of entries) {
    if (e.type === "in") added += e.amount;
    else withdrawn += e.amount;
    count++;
  }
  return { added, withdrawn, net: added - withdrawn, count };
}

/** All money added minus all money withdrawn. */
export function totalBalance(entries: Entry[]): number {
  return sumTotals(entries).net;
}

export function entriesInMonth(entries: Entry[], month: string): Entry[] {
  return entries.filter((e) => monthKeyOf(e.date) === month);
}

export function monthTotals(entries: Entry[], month: string): Totals {
  return sumTotals(entriesInMonth(entries, month));
}

/** Percentage change from `previous` to `current`, or null when it cannot be computed. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Sort newest first: by date, then by creation time. */
export function sortNewestFirst(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
  });
}

export function recentEntries(entries: Entry[], limit = 10): Entry[] {
  return sortNewestFirst(entries).slice(0, limit);
}

/**
 * Monthly report rows, oldest first, with a running balance. Covers every month
 * from the first entry to the later of the last entry and the current month, so gaps show as zero.
 */
export function monthlyReport(entries: Entry[], through: string = currentMonthKey()): MonthRow[] {
  if (entries.length === 0) return [];
  const byMonth = new Map<string, Entry[]>();
  let first = "9999-99";
  let last = "0000-00";
  for (const e of entries) {
    const k = monthKeyOf(e.date);
    if (k < first) first = k;
    if (k > last) last = k;
    const bucket = byMonth.get(k);
    if (bucket) bucket.push(e);
    else byMonth.set(k, [e]);
  }
  if (through > last) last = through;
  let running = 0;
  return monthRange(first, last).map((month) => {
    const t = sumTotals(byMonth.get(month) ?? []);
    running += t.net;
    return { month, ...t, runningBalance: running };
  });
}

/** The last `count` months ending at `end`, always including months with no entries. */
export function trailingMonths(entries: Entry[], end: string, count: number): MonthRow[] {
  const start = addMonths(end, -(count - 1));
  const full = monthlyReport(entries, end);
  const map = new Map(full.map((r) => [r.month, r]));
  // Running balance before the window starts.
  let running = 0;
  for (const r of full) {
    if (r.month < start) running = r.runningBalance;
  }
  return monthRange(start, end).map((month) => {
    const row = map.get(month);
    if (row) return row;
    return { month, ...EMPTY_TOTALS, runningBalance: running };
  });
}

export function yearSummary(entries: Entry[], year: number): YearSummary {
  const inYear = entries.filter((e) => yearOf(e.date) === year);
  const byMonth = new Map<string, Entry[]>();
  for (const e of inYear) {
    const k = monthKeyOf(e.date);
    const bucket = byMonth.get(k);
    if (bucket) bucket.push(e);
    else byMonth.set(k, [e]);
  }
  // Running balance carried in from previous years.
  let running = sumTotals(entries.filter((e) => yearOf(e.date) < year)).net;
  const months: MonthRow[] = [];
  for (let m = 1; m <= 12; m++) {
    const month = makeMonthKey(year, m);
    const t = sumTotals(byMonth.get(month) ?? []);
    running += t.net;
    months.push({ month, ...t, runningBalance: running });
  }
  const active = months.filter((r) => r.count > 0);
  let best: MonthRow | null = null;
  let worst: MonthRow | null = null;
  for (const r of active) {
    if (!best || r.net > best.net) best = r;
    if (!worst || r.net < worst.net) worst = r;
  }
  return {
    year,
    months,
    totals: sumTotals(inYear),
    bestMonth: best?.month ?? null,
    worstMonth: worst && active.length > 1 && worst !== best ? worst.month : null,
  };
}

export function yearsWithEntries(entries: Entry[]): number[] {
  const set = new Set<number>();
  for (const e of entries) set.add(yearOf(e.date));
  const now = new Date().getFullYear();
  set.add(now);
  return [...set].sort((a, b) => b - a);
}

export function categoryBreakdown(
  entries: Entry[],
  categories: Category[],
  type: EntryType,
): CategoryShare[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const buckets = new Map<string | null, { amount: number; count: number }>();
  let total = 0;
  for (const e of entries) {
    if (e.type !== type) continue;
    total += e.amount;
    const b = buckets.get(e.categoryId) ?? { amount: 0, count: 0 };
    b.amount += e.amount;
    b.count += 1;
    buckets.set(e.categoryId, b);
  }
  const rows: CategoryShare[] = [];
  for (const [categoryId, b] of buckets) {
    const c = categoryId ? byId.get(categoryId) : undefined;
    rows.push({
      categoryId,
      name: c?.name ?? "Uncategorised",
      color: c?.color ?? "#8b93a1",
      amount: b.amount,
      count: b.count,
      share: total === 0 ? 0 : b.amount / total,
    });
  }
  return rows.sort((a, b) => b.amount - a.amount);
}

export interface EntryFilters {
  query?: string;
  month?: string | null;
  type?: EntryType | "all";
  categoryId?: string | "all";
  minPaise?: number | null;
  maxPaise?: number | null;
}

export function filterEntries(entries: Entry[], f: EntryFilters, categories: Category[] = []): Entry[] {
  const q = f.query?.trim().toLowerCase() ?? "";
  const names = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
  return entries.filter((e) => {
    if (f.month && monthKeyOf(e.date) !== f.month) return false;
    if (f.type && f.type !== "all" && e.type !== f.type) return false;
    if (f.categoryId && f.categoryId !== "all" && e.categoryId !== f.categoryId) return false;
    if (f.minPaise != null && e.amount < f.minPaise) return false;
    if (f.maxPaise != null && e.amount > f.maxPaise) return false;
    if (q) {
      const hay = `${e.note} ${e.categoryId ? names.get(e.categoryId) ?? "" : ""} ${e.date}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
