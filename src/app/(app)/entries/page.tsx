"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useLedger } from "@/components/providers/LedgerProvider";
import { useQuickAdd } from "@/components/providers/QuickAddProvider";
import type { EntryType } from "@/lib/types";
import { filterEntries, sumTotals } from "@/lib/calc";
import { monthKeyOf, monthLabel } from "@/lib/dates";
import { parseAmountToPaise } from "@/lib/money";
import { entriesToCSV } from "@/lib/csv";
import { downloadText } from "@/lib/download";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { AmountInput } from "@/components/ui/AmountInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { EntryList } from "@/components/ledger/EntryList";
import { Amount } from "@/components/ledger/Amount";
import { cn } from "@/lib/cn";

export default function EntriesPage() {
  const { status, entries, categories } = useLedger();
  const { open } = useQuickAdd();

  const [query, setQuery] = useState("");
  const [month, setMonth] = useState<string>("all");
  const [type, setType] = useState<EntryType | "all">("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const months = useMemo(() => {
    const set = new Set(entries.map((e) => monthKeyOf(e.date)));
    return [...set].sort((a, b) => (a < b ? 1 : -1));
  }, [entries]);

  const minPaise = useMemo(() => {
    const p = parseAmountToPaise(min);
    return p.ok ? p.paise : null;
  }, [min]);
  const maxPaise = useMemo(() => {
    const p = parseAmountToPaise(max);
    return p.ok ? p.paise : null;
  }, [max]);

  const filtered = useMemo(
    () =>
      filterEntries(
        entries,
        { query, month: month === "all" ? null : month, type, categoryId, minPaise, maxPaise },
        categories,
      ),
    [entries, categories, query, month, type, categoryId, minPaise, maxPaise],
  );
  const totals = useMemo(() => sumTotals(filtered), [filtered]);

  const activeFilterCount = [month !== "all", type !== "all", categoryId !== "all", min !== "", max !== ""].filter(Boolean).length;

  function resetFilters() {
    setMonth("all");
    setType("all");
    setCategoryId("all");
    setMin("");
    setMax("");
    setQuery("");
  }

  const visibleCategories = categories.filter((c) => (type === "all" || c.type === type || c.type === "both"));

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Entries</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="h-4 w-4" aria-hidden />}
            disabled={filtered.length === 0}
            onClick={() => downloadText(`money-ledger-entries${month === "all" ? "" : "-" + month}.csv`, entriesToCSV(filtered, categories), "text/csv")}
          >
            CSV
          </Button>
          <Button size="sm" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => open()}>
            Add entry
          </Button>
        </div>
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-3" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search entries"
              className="pl-10"
            />
          </div>
          <Button
            variant="secondary"
            icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />}
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            aria-controls="entry-filters"
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Button>
        </div>

        <div id="entry-filters" className={cn("mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4", !showFilters && "hidden")}>
          <div className="sm:col-span-2 lg:col-span-4">
            <SegmentedControl
              label="Type"
              value={type}
              onChange={(v) => {
                setType(v);
                setCategoryId("all");
              }}
              options={[
                { value: "all", label: "All" },
                { value: "in", label: "Added", tone: "in" },
                { value: "out", label: "Withdrawn", tone: "out" },
              ]}
              className="sm:max-w-sm"
            />
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-fg-2">
            Month
            <Select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-fg-2">
            Category
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="all">All categories</option>
              {visibleCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.archived ? " (archived)" : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-fg-2">
            Minimum amount
            <AmountInput size="md" value={min} onChange={(e) => setMin(e.target.value)} placeholder="0" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-fg-2">
            Maximum amount
            <AmountInput size="md" value={max} onChange={(e) => setMax(e.target.value)} placeholder="No limit" />
          </label>
          {(activeFilterCount > 0 || query) && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Button variant="ghost" size="sm" icon={<X className="h-4 w-4" aria-hidden />} onClick={resetFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        {status === "loading" ? (
          <SkeletonRows rows={8} />
        ) : entries.length === 0 ? (
          <EmptyState
            title="No entries yet"
            description="Everything you add shows up here, grouped by day."
            action={
              <Button icon={<Plus className="h-5 w-5" aria-hidden />} onClick={() => open()}>
                Add entry
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No entries match"
            description="Try a different search or clear the filters."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3 text-sm sm:px-6" aria-live="polite">
              <span className="text-fg-2">
                {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              </span>
              <span className="flex flex-wrap gap-x-4 text-fg-2">
                <span>
                  Added <Amount paise={totals.added} className="font-medium text-in-text" />
                </span>
                <span>
                  Withdrawn <Amount paise={totals.withdrawn} className="font-medium text-out-text" />
                </span>
                <span>
                  Net <Amount paise={totals.net} signed className="font-medium" />
                </span>
              </span>
            </div>
            <EntryList entries={filtered} categories={categories} />
          </>
        )}
      </Card>
    </div>
  );
}
