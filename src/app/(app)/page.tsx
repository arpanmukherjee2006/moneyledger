"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Receipt } from "lucide-react";
import { useLedger } from "@/components/providers/LedgerProvider";
import { useQuickAdd } from "@/components/providers/QuickAddProvider";
import { addMonths, currentMonthKey, monthLabel } from "@/lib/dates";
import { monthTotals, recentEntries, totalBalance, trailingMonths } from "@/lib/calc";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonCard, SkeletonRows } from "@/components/ui/Skeleton";
import { BalanceHero, MonthCards } from "@/components/ledger/StatTiles";
import { MonthSwitcher } from "@/components/ledger/MonthSwitcher";
import { MonthlyChart } from "@/components/ledger/MonthlyChart";
import { BalanceChart } from "@/components/ledger/BalanceChart";
import { EntryList } from "@/components/ledger/EntryList";

export default function HomePage() {
  const { status, entries, categories, mode } = useLedger();
  const { open } = useQuickAdd();
  const [month, setMonth] = useState(() => currentMonthKey());

  const balance = useMemo(() => totalBalance(entries), [entries]);
  const current = useMemo(() => monthTotals(entries, month), [entries, month]);
  const previous = useMemo(() => monthTotals(entries, addMonths(month, -1)), [entries, month]);
  const trailing = useMemo(() => trailingMonths(entries, month, 12), [entries, month]);
  const recent = useMemo(() => recentEntries(entries, 10), [entries]);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4 sm:gap-6" aria-busy="true" aria-label="Loading your ledger">
        <Skeleton className="h-36 rounded-lg" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
        <SkeletonCard lines={6} />
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <BalanceHero balance={0} entryCount={0} mode={mode} />
        <Card>
          <EmptyState
            icon={<Receipt className="h-6 w-6" aria-hidden />}
            title="Add your first entry"
            description="Record money you received or spent. Your balance, monthly totals and charts build from there."
            action={
              <Button size="lg" icon={<Plus className="h-5 w-5" aria-hidden />} onClick={() => open()}>
                Add entry
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BalanceHero balance={balance} entryCount={entries.length} mode={mode} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{monthLabel(month)}</h2>
        <MonthSwitcher value={month} onChange={setMonth} />
      </div>

      <MonthCards month={month} current={current} previous={previous} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6">
        <MonthlyChart rows={trailing} description={`12 months to ${monthLabel(month)}`} />
        <BalanceChart rows={trailing} />
      </div>

      <Card>
        <CardHeader
          title="Recent entries"
          description="Latest 10"
          action={
            <Link href="/entries" className="inline-flex h-9 items-center gap-1 rounded-sm px-2 text-sm font-medium text-accent-text hover:bg-accent-soft">
              All entries <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
        <EntryList entries={recent} categories={categories} grouped={false} className="mt-3 border-t border-border" />
      </Card>
    </div>
  );
}
