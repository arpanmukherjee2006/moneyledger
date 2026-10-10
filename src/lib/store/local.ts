import { createStore, del, get, set } from "idb-keyval";
import type { Category, Entry, LedgerData, Settings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { DEFAULT_CATEGORIES } from "../categories";
import type { LedgerStore } from "./types";

const KEY_ENTRIES = "entries";
const KEY_CATEGORIES = "categories";
const KEY_SETTINGS = "settings";

/**
 * Local-first storage in IndexedDB. Used when no cloud backend is configured.
 * Writes are serialised so concurrent mutations cannot clobber each other.
 */
export class LocalStore implements LedgerStore {
  readonly mode = "local" as const;
  private db = createStore("money-ledger", "ledger");
  private queue: Promise<unknown> = Promise.resolve();
  private entries: Entry[] = [];
  private categories: Category[] = [];
  private settings: Settings = DEFAULT_SETTINGS;

  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => undefined);
    return next;
  }

  async load(): Promise<LedgerData> {
    const [entries, categories, settings] = await Promise.all([
      get<Entry[]>(KEY_ENTRIES, this.db),
      get<Category[]>(KEY_CATEGORIES, this.db),
      get<Settings>(KEY_SETTINGS, this.db),
    ]);
    this.entries = entries ?? [];
    this.categories = categories ?? DEFAULT_CATEGORIES;
    this.settings = { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
    if (!categories) await set(KEY_CATEGORIES, this.categories, this.db);
    return { entries: this.entries, categories: this.categories, settings: this.settings };
  }

  putEntry(entry: Entry): Promise<void> {
    return this.run(async () => {
      const i = this.entries.findIndex((e) => e.id === entry.id);
      const next = [...this.entries];
      if (i >= 0) next[i] = entry;
      else next.push(entry);
      await set(KEY_ENTRIES, next, this.db);
      this.entries = next;
    });
  }

  deleteEntry(id: string): Promise<void> {
    return this.run(async () => {
      const next = this.entries.filter((e) => e.id !== id);
      await set(KEY_ENTRIES, next, this.db);
      this.entries = next;
    });
  }

  putCategory(category: Category): Promise<void> {
    return this.run(async () => {
      const i = this.categories.findIndex((c) => c.id === category.id);
      const next = [...this.categories];
      if (i >= 0) next[i] = category;
      else next.push(category);
      await set(KEY_CATEGORIES, next, this.db);
      this.categories = next;
    });
  }

  putSettings(settings: Settings): Promise<void> {
    return this.run(async () => {
      await set(KEY_SETTINGS, settings, this.db);
      this.settings = settings;
    });
  }

  replaceAll(data: { entries: Entry[]; categories: Category[] }): Promise<void> {
    return this.run(async () => {
      await set(KEY_CATEGORIES, data.categories, this.db);
      await set(KEY_ENTRIES, data.entries, this.db);
      this.entries = data.entries;
      this.categories = data.categories;
    });
  }

  clearAll(): Promise<void> {
    return this.run(async () => {
      await del(KEY_ENTRIES, this.db);
      await del(KEY_CATEGORIES, this.db);
      await del(KEY_SETTINGS, this.db);
      this.entries = [];
      this.categories = DEFAULT_CATEGORIES;
      this.settings = DEFAULT_SETTINGS;
    });
  }
}
