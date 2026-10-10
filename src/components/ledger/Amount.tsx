import type { EntryType } from "@/lib/types";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/cn";

interface AmountProps {
  paise: number;
  /** Colour and sign by entry type (+ for in, − for out). */
  type?: EntryType;
  /** Colour and sign by the value itself (net amounts). */
  signed?: boolean;
  className?: string;
}

/** Money display: Indian grouping, always a symbol, sign and colour never alone. */
export function Amount({ paise, type, signed, className }: AmountProps) {
  if (type) {
    const value = type === "in" ? paise : -paise;
    return (
      <span className={cn("num", type === "in" ? "text-in-text" : "text-out-text", className)}>
        {formatPaise(value, { sign: "always" })}
      </span>
    );
  }
  if (signed) {
    return (
      <span className={cn("num", paise > 0 ? "text-in-text" : paise < 0 ? "text-out-text" : "text-fg", className)}>
        {formatPaise(paise, { sign: "always" })}
      </span>
    );
  }
  return <span className={cn("num", className)}>{formatPaise(paise)}</span>;
}
