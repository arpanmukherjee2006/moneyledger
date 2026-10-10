import type { CategoryShare, MonthRow, Totals } from "./calc";
import type { Category, Entry } from "./types";
import { dateLabel, monthLabel } from "./dates";
import { formatPaise } from "./money";
import { sortNewestFirst } from "./calc";

/**
 * PDF export. The built-in PDF fonts have no ₹ glyph, so amounts are written as "INR 1,25,000.00".
 * The numbers are identical to what is shown on screen.
 */
const money = (p: number) => formatPaise(p, { symbol: "INR ", minus: "-" });

async function createDoc() {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  return { doc, autoTable };
}

function heading(doc: import("jspdf").jsPDF, title: string, subtitle: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, 40, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 40, 68);
  doc.setTextColor(0);
}

export async function exportMonthPDF(input: {
  month: string;
  totals: Totals;
  runningBalance: number | null;
  added: CategoryShare[];
  withdrawn: CategoryShare[];
  entries: Entry[];
  categories: Category[];
}): Promise<void> {
  const { doc, autoTable } = await createDoc();
  const label = monthLabel(input.month);
  heading(doc, `Money Ledger: ${label}`, `Generated ${new Date().toLocaleString("en-IN")}`);

  autoTable(doc, {
    startY: 90,
    head: [["Added", "Withdrawn", "Net", "Balance at month end"]],
    body: [[
      money(input.totals.added),
      money(input.totals.withdrawn),
      money(input.totals.net),
      input.runningBalance == null ? "" : money(input.runningBalance),
    ]],
    styles: { fontSize: 10, halign: "right" },
    headStyles: { fillColor: [31, 41, 55], halign: "right" },
  });

  const breakdown = (title: string, rows: CategoryShare[]) => {
    if (rows.length === 0) return;
    const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, 40, y + 28);
    autoTable(doc, {
      startY: y + 36,
      head: [["Category", "Entries", "Amount", "Share"]],
      body: rows.map((r) => [r.name, String(r.count), money(r.amount), `${(r.share * 100).toFixed(1)}%`]),
      styles: { fontSize: 9 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
      headStyles: { fillColor: [31, 41, 55] },
    });
  };
  breakdown("Added by category", input.added);
  breakdown("Withdrawn by category", input.withdrawn);

  const names = new Map(input.categories.map((c) => [c.id, c.name]));
  const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 90;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Entries", 40, y + 28);
  autoTable(doc, {
    startY: y + 36,
    head: [["Date", "Type", "Category", "Note", "Amount"]],
    body: sortNewestFirst(input.entries).map((e) => [
      dateLabel(e.date),
      e.type === "in" ? "Added" : "Withdrawn",
      e.categoryId ? names.get(e.categoryId) ?? "" : "",
      e.note,
      (e.type === "in" ? "+" : "-") + money(e.amount),
    ]),
    styles: { fontSize: 9 },
    columnStyles: { 4: { halign: "right" } },
    headStyles: { fillColor: [31, 41, 55] },
  });

  doc.save(`money-ledger-${input.month}.pdf`);
}

export async function exportMonthlyReportPDF(rows: MonthRow[], title = "Monthly report"): Promise<void> {
  const { doc, autoTable } = await createDoc();
  heading(doc, `Money Ledger: ${title}`, `Generated ${new Date().toLocaleString("en-IN")}`);
  autoTable(doc, {
    startY: 90,
    head: [["Month", "Entries", "Added", "Withdrawn", "Net", "Running balance"]],
    body: rows.map((r) => [
      monthLabel(r.month),
      String(r.count),
      money(r.added),
      money(r.withdrawn),
      money(r.net),
      money(r.runningBalance),
    ]),
    styles: { fontSize: 9 },
    columnStyles: {
      1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" },
    },
    headStyles: { fillColor: [31, 41, 55] },
  });
  doc.save(`money-ledger-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
