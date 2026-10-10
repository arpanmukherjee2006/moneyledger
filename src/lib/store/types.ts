import type { Category, Entry, LedgerData, Settings } from "../types";

export type StoreMode = "local" | "cloud";

/**
 * Durable storage behind the ledger. Every write resolves only after the data
 * is persisted, so the UI can show success honestly.
 */
export interface LedgerStore {
  readonly mode: StoreMode;
  load(): Promise<LedgerData>;
  putEntry(entry: Entry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
  putCategory(category: Category): Promise<void>;
  putSettings(settings: Settings): Promise<void>;
  /** Replace all entries and categories (restore from backup). */
  replaceAll(data: { entries: Entry[]; categories: Category[] }): Promise<void>;
  /** Permanently delete every record. */
  clearAll(): Promise<void>;
}
