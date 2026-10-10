import type { MonthRow } from "./calc";
import type { Category, Entry } from "./types";
import { monthLabel } from "./dates";
import { paiseToDecimal } from "./money";
import { sortNewestFirst } from "./calc";

function cell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function rows(lines: (string | number)[][]): string {
  return lines.map((l) => l.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Entries as CSV. Amounts are decimal rupees, signed by type, so the column sums to the net. */
export function entriesToCSV(entries: Entry[], categories: Category[]): string {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const header = ["Date", "Type", "Category", "Amount (INR)", "Signed amount (INR)", "Note"];
  const body = sortNewestFirst(entries).map((e) => [
    e.date,
    e.type === "in" ? "Added" : "Withdrawn",
    e.categoryId ? names.get(e.categoryId) ?? "" : "",
    paiseToDecimal(e.amount),
    paiseToDecimal(e.type === "in" ? e.amount : -e.amount),
    e.note,
  ]);
  return rows([header, ...body]);
}

export function monthlyReportToCSV(report: MonthRow[]): string {
  const header = ["Month", "Added (INR)", "Withdrawn (INR)", "Net (INR)", "Running balance (INR)", "Entries"];
  const body = report.map((r) => [
    monthLabel(r.month),
    paiseToDecimal(r.added),
    paiseToDecimal(r.withdrawn),
    paiseToDecimal(r.net),
    paiseToDecimal(r.runningBalance),
    r.count,
  ]);
  return rows([header, ...body]);
}
