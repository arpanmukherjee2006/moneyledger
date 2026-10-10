import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Entry, LedgerData, Settings } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { DEFAULT_CATEGORIES } from "../categories";
import type { LedgerStore } from "./types";

interface EntryRow {
  id: string;
  user_id: string;
  type: "in" | "out";
  amount: number;
  date: string;
  category_id: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  type: "in" | "out" | "both";
  color: string;
  archived: boolean;
  created_at: string;
}

const toEntry = (r: EntryRow): Entry => ({
  id: r.id,
  type: r.type,
  amount: r.amount,
  date: r.date,
  categoryId: r.category_id,
  note: r.note ?? "",
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  type: r.type,
  color: r.color,
  archived: r.archived,
  createdAt: r.created_at,
});

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

/**
 * Cloud storage on Supabase. Row-level security in `supabase/schema.sql` ensures
 * a user can only read and write their own rows.
 */
export class SupabaseStore implements LedgerStore {
  readonly mode = "cloud" as const;

  constructor(private supabase: SupabaseClient, private userId: string) {}

  private entryRow(e: Entry): EntryRow {
    return {
      id: e.id,
      user_id: this.userId,
      type: e.type,
      amount: e.amount,
      date: e.date,
      category_id: e.categoryId,
      note: e.note,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
    };
  }

  private categoryRow(c: Category): CategoryRow {
    return {
      id: c.id,
      user_id: this.userId,
      name: c.name,
      type: c.type,
      color: c.color,
      archived: c.archived,
      created_at: c.createdAt,
    };
  }

  async load(): Promise<LedgerData> {
    const [entriesRes, categoriesRes, settingsRes] = await Promise.all([
      this.supabase.from("entries").select("*").order("date", { ascending: false }).limit(50000),
      this.supabase.from("categories").select("*"),
      this.supabase.from("user_settings").select("settings").eq("user_id", this.userId).maybeSingle(),
    ]);
    if (entriesRes.error) fail("Could not load entries", entriesRes.error);
    if (categoriesRes.error) fail("Could not load categories", categoriesRes.error);
    if (settingsRes.error) fail("Could not load settings", settingsRes.error);

    let categories = (categoriesRes.data as CategoryRow[]).map(toCategory);
    if (categories.length === 0) {
      // First sign-in: seed defaults. Category ids are namespaced per user by the database.
      const seeded = DEFAULT_CATEGORIES.map((c) => ({ ...c, id: `${this.userId.slice(0, 8)}-${c.id}` }));
      const { error } = await this.supabase.from("categories").insert(seeded.map((c) => this.categoryRow(c)));
      if (error) fail("Could not create default categories", error);
      categories = seeded;
    }
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      ...((settingsRes.data?.settings as Partial<Settings> | undefined) ?? {}),
    };
    return { entries: (entriesRes.data as EntryRow[]).map(toEntry), categories, settings };
  }

  async putEntry(entry: Entry): Promise<void> {
    const { error } = await this.supabase.from("entries").upsert(this.entryRow(entry));
    if (error) fail("Could not save entry", error);
  }

  async deleteEntry(id: string): Promise<void> {
    const { error } = await this.supabase.from("entries").delete().eq("id", id);
    if (error) fail("Could not delete entry", error);
  }

  async putCategory(category: Category): Promise<void> {
    const { error } = await this.supabase.from("categories").upsert(this.categoryRow(category));
    if (error) fail("Could not save category", error);
  }

  async putSettings(settings: Settings): Promise<void> {
    const { error } = await this.supabase
      .from("user_settings")
      .upsert({ user_id: this.userId, settings, updated_at: new Date().toISOString() });
    if (error) fail("Could not save settings", error);
  }

  async replaceAll(data: { entries: Entry[]; categories: Category[] }): Promise<void> {
    const { error } = await this.supabase.rpc("replace_ledger", {
      p_categories: data.categories.map((c) => this.categoryRow(c)),
      p_entries: data.entries.map((e) => this.entryRow(e)),
    });
    if (error) fail("Could not restore backup", error);
  }

  async clearAll(): Promise<void> {
    const { error } = await this.supabase.rpc("replace_ledger", { p_categories: [], p_entries: [] });
    if (error) fail("Could not delete data", error);
    const s = await this.supabase.from("user_settings").delete().eq("user_id", this.userId);
    if (s.error) fail("Could not delete settings", s.error);
  }

  /** Permanently deletes the signed-in account and every row that belongs to it. */
  async deleteAccount(): Promise<void> {
    const { error } = await this.supabase.rpc("delete_own_account");
    if (error) fail("Could not delete account", error);
  }
}
