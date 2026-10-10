import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Render the cell. Defaults to String(row[key]). */
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide on small screens. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  /** Visually hide the caption but keep it for screen readers. */
  hideCaption?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  footer?: ReactNode;
  className?: string;
  maxHeight?: string;
}

/** Data table with a sticky header, tabular digits and optional clickable rows. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  hideCaption = true,
  onRowClick,
  rowClassName,
  footer,
  className,
  maxHeight,
}: DataTableProps<T>) {
  return (
    <div className={cn("scroll-thin overflow-auto", className)} style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full border-collapse text-sm">
        <caption className={cn("text-left text-sm text-fg-3", hideCaption ? "sr-only" : "px-4 pb-2")}>{caption}</caption>
        <thead className="sticky top-0 z-10 bg-surface-2 text-xs font-medium uppercase tracking-wide text-fg-3">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "whitespace-nowrap px-4 py-2.5 font-medium",
                  c.align === "right" ? "text-right" : "text-left",
                  c.hideOnMobile && "hidden sm:table-cell",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={rowKey(row)}
                onClick={clickable ? () => onRowClick?.(row) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick?.(row);
                        }
                      }
                    : undefined
                }
                tabIndex={clickable ? 0 : undefined}
                className={cn(
                  clickable && "cursor-pointer transition-colors duration-150 hover:bg-surface-2 focus-visible:bg-surface-2",
                  rowClassName?.(row),
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-fg",
                      c.align === "right" ? "text-right num" : "text-left",
                      c.hideOnMobile && "hidden sm:table-cell",
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        {footer && <tfoot className="border-t border-border-strong bg-surface-2 font-semibold">{footer}</tfoot>}
      </table>
    </div>
  );
}
