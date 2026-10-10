/**
 * Date helpers. Dates are ISO `YYYY-MM-DD` strings; months are `YYYY-MM`.
 * String arithmetic keeps everything timezone-safe.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function currentMonthKey(now: Date = new Date()): string {
  return todayISO(now).slice(0, 7);
}

export function monthKeyOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

export function yearOf(dateISO: string): number {
  return Number(dateISO.slice(0, 4));
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(y, m);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function splitMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
}

export function makeMonthKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

export function addMonths(key: string, delta: number): string {
  const { year, month } = splitMonthKey(key);
  const idx = year * 12 + (month - 1) + delta;
  return makeMonthKey(Math.floor(idx / 12), (idx % 12) + 1);
}

/** Inclusive list of month keys from `from` to `to`. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  let k = from;
  while (k <= to) {
    out.push(k);
    k = addMonths(k, 1);
  }
  return out;
}

export function monthLabel(key: string): string {
  const { year, month } = splitMonthKey(key);
  return `${MONTHS[month - 1]} ${year}`;
}

export function monthShortLabel(key: string): string {
  const { year, month } = splitMonthKey(key);
  return `${MONTHS_SHORT[month - 1]} ${String(year).slice(2)}`;
}

export function monthName(month: number, short = false): string {
  return short ? MONTHS_SHORT[month - 1] : MONTHS[month - 1];
}

/** 10 Oct 2026 */
export function dateLabel(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** Today / Yesterday / 10 Oct 2026 */
export function relativeDateLabel(dateISO: string, today: string = todayISO()): string {
  if (dateISO === today) return "Today";
  const y = new Date(today + "T00:00:00");
  y.setDate(y.getDate() - 1);
  if (dateISO === todayISO(y)) return "Yesterday";
  return dateLabel(dateISO);
}

export function isFutureDate(dateISO: string, today: string = todayISO()): boolean {
  return dateISO > today;
}
