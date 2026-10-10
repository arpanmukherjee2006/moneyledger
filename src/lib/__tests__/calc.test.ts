import { describe, expect, it } from "vitest";
import type { Category, Entry } from "../types";
import {
  categoryBreakdown,
  filterEntries,
  monthTotals,
  monthlyReport,
  percentChange,
  recentEntries,
  totalBalance,
  trailingMonths,
  yearSummary,
} from "../calc";

let n = 0;
function entry(type: "in" | "out", rupees: number, date: string, extra: Partial<Entry> = {}): Entry {
  n++;
  return {
    id: `e${n}`,
    type,
    amount: Math.round(rupees * 100),
    date,
    categoryId: null,
    note: "",
    createdAt: `2026-01-01T00:00:${String(n).padStart(2, "0")}.000Z`,
    updatedAt: `2026-01-01T00:00:${String(n).padStart(2, "0")}.000Z`,
    ...extra,
  };
}

const entries: Entry[] = [
  entry("in", 50000, "2026-08-05"),
  entry("out", 12000, "2026-08-10"),
  entry("in", 25000.5, "2026-09-01"),
  entry("out", 8000.25, "2026-09-15"),
  entry("out", 1000, "2026-09-30"),
  // Nothing in October 2026 on purpose.
  entry("in", 10000, "2026-11-02"),
];

describe("totalBalance", () => {
  it("is all added minus all withdrawn, in paise", () => {
    expect(totalBalance(entries)).toBe(Math.round((50000 - 12000 + 25000.5 - 8000.25 - 1000 + 10000) * 100));
  });
  it("is zero with no entries", () => {
    expect(totalBalance([])).toBe(0);
  });
});

describe("monthTotals", () => {
  it("sums a single month", () => {
    const t = monthTotals(entries, "2026-09");
    expect(t.added).toBe(2500050);
    expect(t.withdrawn).toBe(900025);
    expect(t.net).toBe(1600025);
    expect(t.count).toBe(3);
  });
  it("returns zeros for an empty month", () => {
    expect(monthTotals(entries, "2026-10")).toEqual({ added: 0, withdrawn: 0, net: 0, count: 0 });
  });
});

describe("monthlyReport", () => {
  it("covers every month in range with a running balance", () => {
    const rows = monthlyReport(entries, "2026-11");
    expect(rows.map((r) => r.month)).toEqual(["2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(rows[0].runningBalance).toBe(3800000);
    expect(rows[1].runningBalance).toBe(3800000 + 1600025);
    expect(rows[2].net).toBe(0);
    expect(rows[2].runningBalance).toBe(rows[1].runningBalance);
    expect(rows[3].runningBalance).toBe(totalBalance(entries));
  });
  it("extends through the current month", () => {
    const rows = monthlyReport(entries, "2027-01");
    expect(rows.at(-1)?.month).toBe("2027-01");
    expect(rows.at(-1)?.runningBalance).toBe(totalBalance(entries));
  });
  it("is empty with no entries", () => {
    expect(monthlyReport([])).toEqual([]);
  });
});

describe("trailingMonths", () => {
  it("always returns the requested number of months", () => {
    const rows = trailingMonths(entries, "2026-11", 6);
    expect(rows).toHaveLength(6);
    expect(rows[0].month).toBe("2026-06");
    expect(rows[0].runningBalance).toBe(0);
    expect(rows.at(-1)?.runningBalance).toBe(totalBalance(entries));
  });
  it("carries the balance into a window that starts after the first entry", () => {
    const rows = trailingMonths(entries, "2026-11", 2);
    expect(rows[0].month).toBe("2026-10");
    expect(rows[0].runningBalance).toBe(3800000 + 1600025);
  });
});

describe("yearSummary", () => {
  it("has twelve months, totals and best/worst", () => {
    const y = yearSummary(entries, 2026);
    expect(y.months).toHaveLength(12);
    expect(y.totals.added).toBe(8500050);
    expect(y.bestMonth).toBe("2026-08");
    expect(y.worstMonth).toBe("2026-11");
  });
  it("carries balance from earlier years", () => {
    const withOld = [...entries, entry("in", 100, "2025-03-03")];
    const y = yearSummary(withOld, 2026);
    expect(y.months[0].runningBalance).toBe(10000);
    expect(y.months[11].runningBalance).toBe(totalBalance(withOld));
  });
  it("has no worst month when only one month is active", () => {
    const y = yearSummary([entries[0]], 2026);
    expect(y.bestMonth).toBe("2026-08");
    expect(y.worstMonth).toBeNull();
  });
});

describe("percentChange", () => {
  it("computes percentage change and refuses to divide by zero", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(50, 0)).toBeNull();
  });
});

describe("recentEntries", () => {
  it("sorts by date then creation, newest first", () => {
    const a = entry("in", 1, "2026-05-05", { createdAt: "2026-05-05T01:00:00.000Z" });
    const b = entry("in", 2, "2026-05-05", { createdAt: "2026-05-05T02:00:00.000Z" });
    const c = entry("in", 3, "2026-05-04");
    expect(recentEntries([a, c, b], 2).map((e) => e.amount)).toEqual([200, 100]);
  });
});

describe("categoryBreakdown", () => {
  const cats: Category[] = [
    { id: "rent", name: "Rent", type: "out", color: "#000000", archived: false, createdAt: "" },
    { id: "food", name: "Food", type: "out", color: "#111111", archived: false, createdAt: "" },
  ];
  it("shares sum to one and sort descending", () => {
    const list = [
      entry("out", 300, "2026-01-01", { categoryId: "rent" }),
      entry("out", 100, "2026-01-02", { categoryId: "food" }),
      entry("out", 100, "2026-01-03"),
      entry("in", 999, "2026-01-03"),
    ];
    const rows = categoryBreakdown(list, cats, "out");
    expect(rows.map((r) => r.name)).toEqual(["Rent", "Food", "Uncategorised"]);
    expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1);
    expect(rows[0].share).toBeCloseTo(0.6);
  });
});

describe("filterEntries", () => {
  it("applies month, type, category, amount range and search", () => {
    const cats: Category[] = [
      { id: "rent", name: "Rent", type: "out", color: "#000", archived: false, createdAt: "" },
    ];
    const list = [
      entry("out", 500, "2026-02-01", { categoryId: "rent", note: "Flat" }),
      entry("out", 50, "2026-02-02", { note: "Coffee" }),
      entry("in", 5000, "2026-03-02", { note: "Invoice 42" }),
    ];
    expect(filterEntries(list, { month: "2026-02" })).toHaveLength(2);
    expect(filterEntries(list, { type: "in" })).toHaveLength(1);
    expect(filterEntries(list, { categoryId: "rent" })).toHaveLength(1);
    expect(filterEntries(list, { minPaise: 10000, maxPaise: 100000 })).toHaveLength(1);
    expect(filterEntries(list, { query: "rent" }, cats)).toHaveLength(1);
    expect(filterEntries(list, { query: "invoice" })).toHaveLength(1);
  });
});
