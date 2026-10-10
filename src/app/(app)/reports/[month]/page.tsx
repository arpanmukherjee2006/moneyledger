"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Plus } from "lucide-react";
import { useLedger } from "@/components/providers/LedgerProvider";
import { useQuickAdd } from "@/components/providers/QuickAddProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { categoryBreakdown, entriesInMonth, monthlyReport, sumTotals } from "@/lib/calc";
import { addMonths, monthLabel } from "@/lib/dates";
import { entriesToCSV } from "@/lib/csv";
import { formatPaise } from "@/lib/money";
import { downloadText } from "@/lib/download";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { MonthCards } from "@/components/ledger/StatTiles";
import { MonthSwitcher } from "@/components/ledger/MonthSwitcher";
import { CategoryBreakdown } from "@/components/ledger/CategoryBreakdown";
import { EntryList } from "@/components/ledger/EntryList";

export default function MonthDetailPage() {
  const params = useParams<{ month: string }>();
  const router = useRouter();
  const month = params.month;
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

  const { status, entries, categories } = useLedger();
  const { open } = useQuickAdd();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const monthEntries = useMemo(() => (valid ? entriesInMonth(entries, month) : []), [entries, month, valid]);
  const totals = useMemo(() => sumTotals(monthEntries), [monthEntries]);
  const previous = useMemo(() => (valid ? sumTotals(entriesInMonth(entries, addMonths(month, -1))) : totals), [entries, month, valid, totals]);
  const added = useMemo(() => categoryBreakdown(monthEntries, categories, "in"), [monthEntries, categories]);
  const withdrawn = useMemo(() => categoryBreakdown(monthEntries, categories, "out"), [monthEntries, categories]);
  const runningBalance = useMemo(() => monthlyReport(entries, month).find((r) => r.month === month)?.runningBalance ?? null, [entries, month]);

  if (!valid) {
    return (
      <Card>
        <EmptyState title="That month does not exist" description="Pick a month from the reports list." action={<Link href="/reports" className="text-sm font-medium text-accent-text">Back to reports</Link>} />
      </Card>
    );
  }

  async function exportPDF() {
    setExporting(true);
    try {
      const { exportMonthPDF } = await import("@/lib/pdf");
      await exportMonthPDF({ month, totals, runningBalance, added, withdrawn, entries: monthEntries, categories });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : "Could not create the PDF.", tone: "error" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/reports" className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-fg-2 hover:bg-surface-2" aria-label="Back to reports">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="text-xl font-semibold">{monthLabel(month)}</h1>
        </div>
        <MonthSwitcher value={month} onChange={(m) => router.replace(`/reports/${m}`)} />
      </div>

      {status === "loading" ? (
        <SkeletonCard lines={6} />
      ) : (
        <>
          <MonthCards month={month} current={totals} previous={previous} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-fg-2">
              {totals.count} {totals.count === 1 ? "entry" : "entries"}
              {runningBalance !== null && (
                <>
                  {" "}
                  · balance at month end <span className="num font-medium text-fg">{formatPaise(runningBalance)}</span>
                </>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="h-4 w-4" aria-hidden />}
                disabled={monthEntries.length === 0}
                onClick={() => downloadText(`money-ledger-${month}.csv`, entriesToCSV(monthEntries, categories), "text/csv")}
              >
                CSV
              </Button>
              <Button variant="secondary" size="sm" loading={exporting} disabled={monthEntries.length === 0} icon={<FileText className="h-4 w-4" aria-hidden />} onClick={exportPDF}>
                PDF
              </Button>
            </div>
          </div>

          {monthEntries.length === 0 ? (
            <Card>
              <EmptyState
                title={`Nothing recorded in ${monthLabel(month)}`}
                description="Add an entry dated in this month and it will appear here."
                action={
                  <Button icon={<Plus className="h-5 w-5" aria-hidden />} onClick={() => open()}>
                    Add entry
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6">
                <Card>
                  <CardHeader title="Added by category" as="h2" />
                  <CardBody>
                    <CategoryBreakdown rows={added} type="in" total={totals.added} />
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Withdrawn by category" as="h2" />
                  <CardBody>
                    <CategoryBreakdown rows={withdrawn} type="out" total={totals.withdrawn} />
                  </CardBody>
                </Card>
              </div>
              <Card>
                <CardHeader title="Every entry" description="Select an entry to edit it." />
                <EntryList entries={monthEntries} categories={categories} className="mt-3 border-t border-border" />
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
