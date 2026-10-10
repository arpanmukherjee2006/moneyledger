"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthRow } from "@/lib/calc";
import { monthShortLabel, monthLabel } from "@/lib/dates";
import { formatCompact, formatPaise } from "@/lib/money";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Amount } from "./Amount";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3 } from "lucide-react";

interface Props {
  rows: MonthRow[];
  title?: string;
  description?: string;
}

/** Grouped bars: money added vs withdrawn per month. Has a table view. */
export function MonthlyChart({ rows, title = "Added vs withdrawn", description = "Last 12 months" }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const hasData = rows.some((r) => r.count > 0);
  const data = rows.map((r) => ({ month: r.month, label: monthShortLabel(r.month), added: r.added / 100, withdrawn: r.withdrawn / 100 }));

  return (
    <Card>
      <CardHeader
        title={title}
        description={description}
        action={
          <Button variant="ghost" size="sm" onClick={() => setView(view === "chart" ? "table" : "chart")} aria-pressed={view === "table"}>
            {view === "chart" ? "Show table" : "Show chart"}
          </Button>
        }
      />
      <CardBody className="pt-3">
        {!hasData ? (
          <EmptyState icon={<BarChart3 className="h-6 w-6" aria-hidden />} title="Nothing to chart yet" description="Add a few entries and this chart fills in month by month." />
        ) : view === "table" ? (
          <DataTable
            caption={`${title}, ${description}`}
            rows={rows}
            rowKey={(r) => r.month}
            maxHeight="320px"
            columns={[
              { key: "month", header: "Month", cell: (r) => monthLabel(r.month) },
              { key: "added", header: "Added", align: "right", cell: (r) => <Amount paise={r.added} /> },
              { key: "withdrawn", header: "Withdrawn", align: "right", cell: (r) => <Amount paise={r.withdrawn} /> },
              { key: "net", header: "Net", align: "right", cell: (r) => <Amount paise={r.net} signed /> },
            ]}
          />
        ) : (
          <div className="h-64 w-full" role="img" aria-label={`Bar chart of money added and withdrawn per month. Use the table view for exact figures.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--axis)", fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={{ fill: "var(--axis)", fontSize: 12 }}
                  tickFormatter={(v: number) => formatCompact(Math.round(v * 100))}
                />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as { month: string };
                    return (
                      <div className="rounded-sm border border-border bg-surface px-3 py-2 text-sm shadow-float">
                        <p className="mb-1 font-medium text-fg">{monthLabel(row.month)}</p>
                        {payload.map((p) => (
                          <p key={String(p.dataKey)} className="flex justify-between gap-4 text-fg-2">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} aria-hidden />
                              {p.dataKey === "added" ? "Added" : "Withdrawn"}
                            </span>
                            <span className="num text-fg">{formatPaise(Math.round(Number(p.value) * 100))}</span>
                          </p>
                        ))}
                        <span className="sr-only">{label}</span>
                      </div>
                    );
                  }}
                />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, color: "var(--fg-2)" }} formatter={(v) => (v === "added" ? "Added" : "Withdrawn")} />
                <Bar dataKey="added" name="added" fill="var(--in)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="withdrawn" name="withdrawn" fill="var(--out)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
