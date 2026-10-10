/**
 * Money helpers. All amounts are integer paise. Formatting happens only here, at display time.
 */

/** Upper limit for a single entry: ₹100 crore. */
export const MAX_PAISE = 100_00_00_000 * 100;

export const MINUS = "−";

export type ParseResult =
  | { ok: true; paise: number }
  | { ok: false; error: string };

/** Parse user input such as "1,250.50" or "₹ 1250" into paise. */
export function parseAmountToPaise(raw: string): ParseResult {
  const cleaned = raw.replace(/[₹,\s]/g, "").replace(/^Rs\.?/i, "");
  if (cleaned === "") return { ok: false, error: "Enter an amount." };
  if (!/^\d*(\.\d*)?$/.test(cleaned)) {
    return { ok: false, error: "Use digits and at most one decimal point." };
  }
  const [whole = "0", frac = ""] = cleaned.split(".");
  if (frac.length > 2) return { ok: false, error: "Amounts can have at most two decimals." };
  if (whole.length > 11) return { ok: false, error: "That amount is too large." };
  const paise = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (!Number.isSafeInteger(paise)) return { ok: false, error: "That amount is too large." };
  if (paise <= 0) return { ok: false, error: "Amount must be more than zero." };
  if (paise > MAX_PAISE) return { ok: false, error: "Amount must be ₹100 crore or less." };
  return { ok: true, paise };
}

/** Indian digit grouping: 1,25,000 */
export function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return parts.join(",") + "," + last3;
}

export interface FormatOptions {
  /** "auto": minus only for negatives. "always": + or − on every non-zero value. "never": no sign. */
  sign?: "auto" | "always" | "never";
  /** Currency symbol. Defaults to ₹. Use "INR " for environments without the glyph (PDF). */
  symbol?: string;
  /** Minus character. Defaults to a true minus sign. */
  minus?: string;
  /** Hide the decimal part when it is zero. Default false (always two decimals). */
  compactZero?: boolean;
}

/** Format paise as currency: ₹1,25,000.00. */
export function formatPaise(paise: number, opts: FormatOptions = {}): string {
  const { sign = "auto", symbol = "₹", minus = MINUS, compactZero = false } = opts;
  const negative = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const rupees = Math.floor(abs / 100);
  const rem = abs % 100;
  const fraction = compactZero && rem === 0 ? "" : "." + String(rem).padStart(2, "0");
  const body = symbol + groupIndian(String(rupees)) + fraction;
  if (sign === "never") return body;
  if (negative) return minus + body;
  if (sign === "always" && paise > 0) return "+" + body;
  return body;
}

/** Decimal string for CSV and inputs: 1250.50 (no grouping, no symbol). */
export function paiseToDecimal(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const s = Math.floor(abs / 100) + "." + String(abs % 100).padStart(2, "0");
  return negative ? "-" + s : s;
}

/** Short form for chart axes: ₹1.2L, ₹3.5Cr, ₹850 */
export function formatCompact(paise: number): string {
  const abs = Math.abs(paise) / 100;
  const sign = paise < 0 ? MINUS : "";
  if (abs >= 1_00_00_000) return `${sign}₹${trim((abs / 1_00_00_000).toFixed(2))}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${trim((abs / 1_00_000).toFixed(2))}L`;
  if (abs >= 1_000) return `${sign}₹${trim((abs / 1_000).toFixed(1))}k`;
  return `${sign}₹${trim(abs.toFixed(0))}`;
}

function trim(s: string): string {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}
