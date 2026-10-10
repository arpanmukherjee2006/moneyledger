import type { BackupFile, Category, Entry, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { isValidISODate } from "./dates";
import { MAX_PAISE } from "./money";

export interface BackupPreview {
  entries: Entry[];
  categories: Category[];
  settings: Settings | null;
  exportedAt: string | null;
  summary: {
    entryCount: number;
    categoryCount: number;
    firstDate: string | null;
    lastDate: string | null;
    added: number;
    withdrawn: number;
  };
}

export type BackupValidation =
  | { ok: true; preview: BackupPreview }
  | { ok: false; error: string };

export function createBackup(entries: Entry[], categories: Category[], settings: Settings): BackupFile {
  return {
    app: "money-ledger",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    categories,
    settings,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateEntry(raw: unknown, index: number): Entry | string {
  if (!isRecord(raw)) return `Entry ${index + 1} is not an object.`;
  const { id, type, amount, date, categoryId, note, createdAt, updatedAt } = raw;
  if (typeof id !== "string" || !id) return `Entry ${index + 1} has no id.`;
  if (type !== "in" && type !== "out") return `Entry ${index + 1} has an unknown type.`;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0 || amount > MAX_PAISE) {
    return `Entry ${index + 1} has an invalid amount.`;
  }
  if (typeof date !== "string" || !isValidISODate(date)) return `Entry ${index + 1} has an invalid date.`;
  if (categoryId !== null && categoryId !== undefined && typeof categoryId !== "string") {
    return `Entry ${index + 1} has an invalid category.`;
  }
  const now = new Date().toISOString();
  return {
    id,
    type,
    amount,
    date,
    categoryId: typeof categoryId === "string" ? categoryId : null,
    note: typeof note === "string" ? note : "",
    createdAt: typeof createdAt === "string" ? createdAt : now,
    updatedAt: typeof updatedAt === "string" ? updatedAt : now,
  };
}

function validateCategory(raw: unknown, index: number): Category | string {
  if (!isRecord(raw)) return `Category ${index + 1} is not an object.`;
  const { id, name, type, color, archived, createdAt } = raw;
  if (typeof id !== "string" || !id) return `Category ${index + 1} has no id.`;
  if (typeof name !== "string" || !name.trim()) return `Category ${index + 1} has no name.`;
  if (type !== "in" && type !== "out" && type !== "both") return `Category ${index + 1} has an unknown type.`;
  return {
    id,
    name: name.trim(),
    type,
    color: typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) ? color : "#64748b",
    archived: archived === true,
    createdAt: typeof createdAt === "string" ? createdAt : new Date().toISOString(),
  };
}

/** Parse and validate a backup file's text. Returns a preview the user confirms before restoring. */
export function validateBackup(text: string): BackupValidation {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }
  if (!isRecord(json)) return { ok: false, error: "This file does not look like a Money Ledger backup." };
  if (json.app !== "money-ledger") return { ok: false, error: "This file was not created by Money Ledger." };
  if (json.version !== 1) return { ok: false, error: `Unsupported backup version: ${String(json.version)}.` };
  if (!Array.isArray(json.entries)) return { ok: false, error: "The backup has no entries list." };
  if (!Array.isArray(json.categories)) return { ok: false, error: "The backup has no categories list." };

  const categories: Category[] = [];
  for (let i = 0; i < json.categories.length; i++) {
    const r = validateCategory(json.categories[i], i);
    if (typeof r === "string") return { ok: false, error: r };
    categories.push(r);
  }
  const catIds = new Set(categories.map((c) => c.id));
  const entries: Entry[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < json.entries.length; i++) {
    const r = validateEntry(json.entries[i], i);
    if (typeof r === "string") return { ok: false, error: r };
    if (seen.has(r.id)) return { ok: false, error: `Entry ${i + 1} has a duplicate id.` };
    seen.add(r.id);
    if (r.categoryId && !catIds.has(r.categoryId)) r.categoryId = null;
    entries.push(r);
  }

  let settings: Settings | null = null;
  if (isRecord(json.settings)) {
    const s = json.settings;
    settings = {
      ...DEFAULT_SETTINGS,
      theme: s.theme === "light" || s.theme === "dark" ? s.theme : "system",
      lastType: s.lastType === "out" ? "out" : "in",
    };
  }

  let added = 0;
  let withdrawn = 0;
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  for (const e of entries) {
    if (e.type === "in") added += e.amount;
    else withdrawn += e.amount;
    if (!firstDate || e.date < firstDate) firstDate = e.date;
    if (!lastDate || e.date > lastDate) lastDate = e.date;
  }

  return {
    ok: true,
    preview: {
      entries,
      categories,
      settings,
      exportedAt: typeof json.exportedAt === "string" ? json.exportedAt : null,
      summary: { entryCount: entries.length, categoryCount: categories.length, firstDate, lastDate, added, withdrawn },
    },
  };
}
