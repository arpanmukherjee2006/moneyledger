"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import type { MonthRow } from "@/lib/calc";
import { monthLabel, monthShortLabel } from "@/lib/dates";
import { formatCompact, formatPaise } from "@/lib/money";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Amount } from "./Amount";

interface Props {
  rows: MonthRow[];
}

/** Single-series area: running balance at each month end. Has a table view. */
export function BalanceChart({ rows }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const hasData = rows.some((r) => r.count > 0);
  const data = rows.map((r) => ({ month: r.month, label: monthShortLabel(r.month), balance: r.runningBalance / 100 }));

  return (
    <Card>
      <CardHeader
        title="Balance over time"
        description="At the end of each month"
        action={
          <Button variant="ghost" size="sm" onClick={() => setView(view === "chart" ? "table" : "chart")} aria-pressed={view === "table"}>
            {view === "chart" ? "Show table" : "Show chart"}
          </Button>
        }
      />
      <CardBody className="pt-3">
        {!hasData ? (
          <EmptyState icon={<TrendingUp className="h-6 w-6" aria-hidden />} title="No balance history yet" description="Your running balance appears here once you have entries." />
        ) : view === "table" ? (
          <DataTable
            caption="Balance at the end of each month"
            rows={rows}
            rowKey={(r) => r.month}
            maxHeight="320px"
            columns={[
              { key: "month", header: "Month", cell: (r) => monthLabel(r.month) },
              { key: "net", header: "Net", align: "right", cell: (r) => <Amount paise={r.net} signed /> },
              { key: "balance", header: "Balance", align: "right", cell: (r) => <Amount paise={r.runningBalance} /> },
            ]}
          />
        ) : (
          <div className="h-64 w-full" role="img" aria-label="Area chart of the running balance at each month end. Use the table view for exact figures.">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--axis)", fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={{ fill: "var(--axis)", fontSize: 12 }}
                  tickFormatter={(v: number) => formatCompact(Math.round(v * 100))}
                />
                <ReferenceLine y={0} stroke="var(--border-strong)" />
                <Tooltip
                  cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload as { month: string; balance: number };
                    return (
                      <div className="rounded-sm border border-border bg-surface px-3 py-2 text-sm shadow-float">
                        <p className="font-medium text-fg">{monthLabel(row.month)}</p>
                        <p className="text-fg-2">
                          Balance <span className="num ml-2 text-fg">{formatPaise(Math.round(row.balance * 100))}</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#balanceFill)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)", fill: "var(--accent)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
