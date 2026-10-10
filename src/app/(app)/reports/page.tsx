"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Trophy, TrendingDown } from "lucide-react";
import { useLedger } from "@/components/providers/LedgerProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { monthlyReport, yearSummary, yearsWithEntries } from "@/lib/calc";
import { monthLabel, monthName } from "@/lib/dates";
import { monthlyReportToCSV } from "@/lib/csv";
import { downloadText } from "@/lib/download";
import { formatPaise } from "@/lib/money";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Amount } from "@/components/ledger/Amount";
import { MonthlyChart } from "@/components/ledger/MonthlyChart";
import { cn } from "@/lib/cn";

type View = "monthly" | "year";

export default function ReportsPage() {
  const { status, entries } = useLedger();
  const { toast } = useToast();
  const router = useRouter();
  const [view, setView] = useState<View>("monthly");
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  const report = useMemo(() => monthlyReport(entries), [entries]);
  const newestFirst = useMemo(() => [...report].reverse(), [report]);
  const years = useMemo(() => yearsWithEntries(entries), [entries]);
  const summary = useMemo(() => yearSummary(entries, year), [entries, year]);

  async function exportPDF(rows: typeof report, title: string) {
    setExporting(true);
    try {
      const { exportMonthlyReportPDF } = await import("@/lib/pdf");
      await exportMonthlyReportPDF(rows, title);
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Could not create the PDF.", tone: "error" });
    } finally {
      setExporting(false);
    }
  }

  const monthlyColumns = [
    { key: "month", header: "Month", cell: (r: (typeof report)[number]) => <span className="font-medium">{monthLabel(r.month)}</span> },
    { key: "count", header: "Entries", align: "right" as const, hideOnMobile: true, cell: (r: (typeof report)[number]) => r.count },
    { key: "added", header: "Added", align: "right" as const, cell: (r: (typeof report)[number]) => <Amount paise={r.added} className="text-in-text" /> },
    { key: "withdrawn", header: "Withdrawn", align: "right" as const, cell: (r: (typeof report)[number]) => <Amount paise={r.withdrawn} className="text-out-text" /> },
    { key: "net", header: "Net", align: "right" as const, cell: (r: (typeof report)[number]) => <Amount paise={r.net} signed /> },
    { key: "balance", header: "Running balance", align: "right" as const, cell: (r: (typeof report)[number]) => <Amount paise={r.runningBalance} className="font-medium" /> },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <h1 className="text-xl font-semibold">Reports</h1>
      <Tabs
        label="Report view"
        value={view}
        onChange={setView}
        items={[
          { value: "monthly", label: "Monthly" },
          { value: "year", label: "Year" },
        ]}
      />

      {status === "loading" ? (
        <SkeletonCard lines={8} />
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="h-6 w-6" aria-hidden />}
            title="No reports yet"
            description="Reports build themselves from your entries. Add the first one from the Home screen."
          />
        </Card>
      ) : view === "monthly" ? (
        <>
          <Card>
            <CardHeader
              title="Monthly report"
              description="Select a month to see its category breakdown and entries."
              action={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download className="h-4 w-4" aria-hidden />}
                    onClick={() => downloadText("money-ledger-monthly-report.csv", monthlyReportToCSV(report), "text/csv")}
                  >
                    CSV
                  </Button>
                  <Button variant="secondary" size="sm" loading={exporting} icon={<FileText className="h-4 w-4" aria-hidden />} onClick={() => exportPDF(report, "Monthly report")}>
                    PDF
                  </Button>
                </div>
              }
            />
            <DataTable
              className="mt-4 border-t border-border"
              caption="Monthly totals with running balance, newest first"
              rows={newestFirst}
              rowKey={(r) => r.month}
              columns={monthlyColumns}
              onRowClick={(r) => router.push(`/reports/${r.month}`)}
              rowClassName={(r) => (r.count === 0 ? "text-fg-3" : undefined)}
            />
          </Card>
          <MonthlyChart rows={report.slice(-12)} description="Last 12 months on record" />
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-fg-2">
              Year
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32">
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </label>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="h-4 w-4" aria-hidden />}
                onClick={() => downloadText(`money-ledger-${year}.csv`, monthlyReportToCSV(summary.months), "text/csv")}
              >
                CSV
              </Button>
              <Button variant="secondary" size="sm" loading={exporting} icon={<FileText className="h-4 w-4" aria-hidden />} onClick={() => exportPDF(summary.months, `Year ${year}`)}>
                PDF
              </Button>
            </div>
          </div>

          <section aria-label={`Totals for ${year}`} className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <Card className="px-4 py-4 sm:px-5">
              <p className="text-sm font-medium text-fg-2">Added in {year}</p>
              <p className="num mt-1 text-xl font-semibold text-in-text">+{formatPaise(summary.totals.added)}</p>
            </Card>
            <Card className="px-4 py-4 sm:px-5">
              <p className="text-sm font-medium text-fg-2">Withdrawn in {year}</p>
              <p className="num mt-1 text-xl font-semibold text-out-text">−{formatPaise(summary.totals.withdrawn)}</p>
            </Card>
            <Card className="px-4 py-4 sm:px-5">
              <p className="text-sm font-medium text-fg-2">Net for {year}</p>
              <p className="mt-1 text-xl font-semibold">
                <Amount paise={summary.totals.net} signed />
              </p>
            </Card>
          </section>

          {summary.bestMonth && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <Card className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-in-soft text-in-text" aria-hidden>
                  <Trophy className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-fg-3">Best month</p>
                  <p className="text-sm font-medium">
                    {monthLabel(summary.bestMonth)} ·{" "}
                    <Amount paise={summary.months.find((m) => m.month === summary.bestMonth)!.net} signed />
                  </p>
                </div>
              </Card>
              {summary.worstMonth && (
                <Card className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-out-soft text-out-text" aria-hidden>
                    <TrendingDown className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-fg-3">Worst month</p>
                    <p className="text-sm font-medium">
                      {monthLabel(summary.worstMonth)} ·{" "}
                      <Amount paise={summary.months.find((m) => m.month === summary.worstMonth)!.net} signed />
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          <Card>
            <CardHeader title={`All months of ${year}`} description="Best and worst months by net are highlighted." />
            <DataTable
              className="mt-4 border-t border-border"
              caption={`Month by month for ${year}`}
              rows={summary.months}
              rowKey={(r) => r.month}
              onRowClick={(r) => router.push(`/reports/${r.month}`)}
              rowClassName={(r) =>
                cn(
                  r.count === 0 && "text-fg-3",
                  r.month === summary.bestMonth && "bg-in-soft/60",
                  r.month === summary.worstMonth && "bg-out-soft/60",
                )
              }
              columns={[
                {
                  key: "month",
                  header: "Month",
                  cell: (r) => (
                    <span className="font-medium">
                      {monthName(Number(r.month.slice(5)), true)}
                      {r.month === summary.bestMonth && <span className="ml-2 text-xs text-in-text">Best</span>}
                      {r.month === summary.worstMonth && <span className="ml-2 text-xs text-out-text">Worst</span>}
                    </span>
                  ),
                },
                { key: "count", header: "Entries", align: "right", hideOnMobile: true, cell: (r) => r.count },
                { key: "added", header: "Added", align: "right", cell: (r) => <Amount paise={r.added} className="text-in-text" /> },
                { key: "withdrawn", header: "Withdrawn", align: "right", cell: (r) => <Amount paise={r.withdrawn} className="text-out-text" /> },
                { key: "net", header: "Net", align: "right", cell: (r) => <Amount paise={r.net} signed /> },
                { key: "balance", header: "Running balance", align: "right", cell: (r) => <Amount paise={r.runningBalance} className="font-medium" /> },
              ]}
              footer={
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td className="hidden px-4 py-3 text-right sm:table-cell">{summary.totals.count}</td>
                  <td className="px-4 py-3 text-right num text-in-text">{formatPaise(summary.totals.added)}</td>
                  <td className="px-4 py-3 text-right num text-out-text">{formatPaise(summary.totals.withdrawn)}</td>
                  <td className="px-4 py-3 text-right num">
                    <Amount paise={summary.totals.net} signed />
                  </td>
                  <td className="px-4 py-3 text-right num">{formatPaise(summary.months[11].runningBalance)}</td>
                </tr>
              }
            />
          </Card>
          <MonthlyChart rows={summary.months} title={`Added vs withdrawn, ${year}`} description="All twelve months" />
        </>
      )}
    </div>
  );
}
