import { describe, expect, it } from "vitest";
import { entriesToCSV, monthlyReportToCSV } from "../csv";
import { monthlyReport } from "../calc";
import type { Category, Entry } from "../types";

const cats: Category[] = [
  { id: "c1", name: "Client payment", type: "in", color: "#2a78d6", archived: false, createdAt: "" },
];

const entries: Entry[] = [
  {
    id: "a", type: "in", amount: 12500050, date: "2026-09-01", categoryId: "c1",
    note: 'Invoice "42", final', createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "b", type: "out", amount: 99900, date: "2026-09-03", categoryId: null,
    note: "Line one\nline two", createdAt: "2026-09-03T00:00:00Z", updatedAt: "2026-09-03T00:00:00Z",
  },
];

describe("entriesToCSV", () => {
  it("writes a header, escapes quotes and newlines, and signs amounts by type", () => {
    const csv = entriesToCSV(entries, cats);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Date,Type,Category,Amount (INR),Signed amount (INR),Note");
    expect(lines[1]).toBe('2026-09-03,Withdrawn,,999.00,-999.00,"Line one\nline two"');
    expect(lines[2]).toBe('2026-09-01,Added,Client payment,125000.50,125000.50,"Invoice ""42"", final"');
    expect(lines.at(-1)).toBe("");
  });
});

describe("monthlyReportToCSV", () => {
  it("matches the on-screen report numbers", () => {
    const rows = monthlyReport(entries, "2026-09");
    const csv = monthlyReportToCSV(rows);
    expect(csv).toBe(
      "Month,Added (INR),Withdrawn (INR),Net (INR),Running balance (INR),Entries\r\n" +
        "September 2026,125000.50,999.00,124001.50,124001.50,2\r\n",
    );
  });
});
