import { describe, expect, it } from "vitest";
import { createBackup, validateBackup } from "../backup";
import { DEFAULT_CATEGORIES } from "../categories";
import { DEFAULT_SETTINGS } from "../types";
import type { Entry } from "../types";

const entries: Entry[] = [
  {
    id: "a", type: "in", amount: 100000, date: "2026-01-10", categoryId: "in-client",
    note: "", createdAt: "2026-01-10T00:00:00Z", updatedAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "b", type: "out", amount: 2500, date: "2026-02-01", categoryId: "ghost",
    note: "", createdAt: "2026-02-01T00:00:00Z", updatedAt: "2026-02-01T00:00:00Z",
  },
];

describe("backup round trip", () => {
  it("validates its own output and summarises it", () => {
    const text = JSON.stringify(createBackup(entries, DEFAULT_CATEGORIES, DEFAULT_SETTINGS));
    const result = validateBackup(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.summary).toEqual({
      entryCount: 2,
      categoryCount: DEFAULT_CATEGORIES.length,
      firstDate: "2026-01-10",
      lastDate: "2026-02-01",
      added: 100000,
      withdrawn: 2500,
    });
    // Unknown category ids are dropped rather than rejected.
    expect(result.preview.entries[1].categoryId).toBeNull();
  });

  it("rejects files that are not backups", () => {
    expect(validateBackup("not json").ok).toBe(false);
    expect(validateBackup("{}").ok).toBe(false);
    expect(validateBackup(JSON.stringify({ app: "money-ledger", version: 2, entries: [], categories: [] })).ok).toBe(false);
  });

  it("rejects corrupt entries", () => {
    const bad = {
      app: "money-ledger", version: 1, categories: [],
      entries: [{ id: "x", type: "in", amount: 10.5, date: "2026-01-01" }],
    };
    const r = validateBackup(JSON.stringify(bad));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/invalid amount/);
    const badDate = { ...bad, entries: [{ id: "x", type: "in", amount: 10, date: "2026-02-30" }] };
    expect(validateBackup(JSON.stringify(badDate)).ok).toBe(false);
  });
});
