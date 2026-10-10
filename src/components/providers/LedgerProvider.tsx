"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Category, Entry, EntryType, Settings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import type { LedgerStore, StoreMode } from "@/lib/store/types";
import { LocalStore } from "@/lib/store/local";
import { SupabaseStore } from "@/lib/store/supabase";
import { CLOUD_ENABLED } from "@/lib/supabase/config";
import { newId } from "@/lib/ids";
import { useToast } from "./ToastProvider";
import { useTheme } from "./ThemeProvider";

export interface EntryInput {
  type: EntryType;
  amount: number;
  date: string;
  categoryId: string | null;
  note: string;
}

export interface CategoryInput {
  name: string;
  type: Category["type"];
  color: string;
}

export interface LedgerUser {
  id: string;
  email: string | null;
}

export interface LedgerContextValue {
  status: "loading" | "ready" | "error";
  error: string | null;
  mode: StoreMode;
  user: LedgerUser | null;
  entries: Entry[];
  categories: Category[];
  settings: Settings;
  addEntry: (input: EntryInput) => Promise<Entry>;
  updateEntry: (id: string, input: EntryInput) => Promise<Entry>;
  /** Deletes and shows a toast with a 10-second undo. */
  deleteEntry: (id: string) => Promise<void>;
  addCategory: (input: CategoryInput) => Promise<Category>;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id" | "createdAt">>) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  restore: (data: { entries: Entry[]; categories: Category[] }) => Promise<void>;
  clearAll: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { setPreference } = useTheme();

  const storeRef = useRef<LedgerStore | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<LedgerUser | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [attempt, setAttempt] = useState(0);

  // Boot: pick the store, sign-in gate for cloud mode, then load everything.
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        let store: LedgerStore;
        if (CLOUD_ENABLED) {
          const { getSupabase } = await import("@/lib/supabase/client");
          const supabase = getSupabase();
          const { data } = await supabase.auth.getSession();
          const session = data.session;
          if (!session) {
            router.replace("/login");
            return;
          }
          setUser({ id: session.user.id, email: session.user.email ?? null });
          store = new SupabaseStore(supabase, session.user.id);
        } else {
          store = new LocalStore();
        }
        const data = await store.load();
        if (cancelled) return;
        storeRef.current = store;
        setEntries(data.entries);
        setCategories(data.categories);
        setSettings(data.settings);
        if (store.mode === "cloud" && data.settings.theme) setPreference(data.settings.theme);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(describe(err));
        setStatus("error");
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [attempt, router, setPreference]);

  // Cloud mode: react to sign-out from another tab.
  useEffect(() => {
    if (!CLOUD_ENABLED) return;
    let unsub: (() => void) | undefined;
    import("@/lib/supabase/client").then(({ getSupabase }) => {
      const { data } = getSupabase().auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") router.replace("/login");
      });
      unsub = () => data.subscription.unsubscribe();
    });
    return () => unsub?.();
  }, [router]);

  const store = () => {
    const s = storeRef.current;
    if (!s) throw new Error("Storage is not ready yet.");
    return s;
  };

  const addEntry = useCallback(async (input: EntryInput) => {
    const now = new Date().toISOString();
    const entry: Entry = { id: newId(), ...input, note: input.note.trim(), createdAt: now, updatedAt: now };
    await store().putEntry(entry);
    setEntries((list) => [...list, entry]);
    // Remember the last used type and category (F6).
    setSettings((s) => {
      const next: Settings = {
        ...s,
        lastType: input.type,
        lastCategoryId: { ...s.lastCategoryId, [input.type]: input.categoryId },
      };
      store().putSettings(next).catch(() => undefined);
      return next;
    });
    return entry;
  }, []);

  const updateEntry = useCallback(async (id: string, input: EntryInput) => {
    let updated: Entry | null = null;
    const current = entries.find((e) => e.id === id);
    if (!current) throw new Error("That entry no longer exists.");
    updated = { ...current, ...input, note: input.note.trim(), updatedAt: new Date().toISOString() };
    await store().putEntry(updated);
    setEntries((list) => list.map((e) => (e.id === id ? updated! : e)));
    return updated;
  }, [entries]);

  const deleteEntry = useCallback(
    async (id: string) => {
      const removed = entries.find((e) => e.id === id);
      if (!removed) return;
      await store().deleteEntry(id);
      setEntries((list) => list.filter((e) => e.id !== id));
      toast({
        message: "Entry deleted",
        tone: "info",
        action: {
          label: "Undo",
          onClick: () => {
            store()
              .putEntry(removed)
              .then(() => setEntries((list) => [...list, removed]))
              .catch((err) => toast({ message: `Could not restore entry: ${describe(err)}`, tone: "error" }));
          },
        },
      });
    },
    [entries, toast],
  );

  const addCategory = useCallback(async (input: CategoryInput) => {
    const category: Category = {
      id: newId(),
      name: input.name.trim(),
      type: input.type,
      color: input.color,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    await store().putCategory(category);
    setCategories((list) => [...list, category]);
    return category;
  }, []);

  const updateCategory = useCallback(
    async (id: string, patch: Partial<Omit<Category, "id" | "createdAt">>) => {
      const current = categories.find((c) => c.id === id);
      if (!current) throw new Error("That category no longer exists.");
      const next = { ...current, ...patch, name: (patch.name ?? current.name).trim() };
      await store().putCategory(next);
      setCategories((list) => list.map((c) => (c.id === id ? next : c)));
    },
    [categories],
  );

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    await store().putSettings(next);
    setSettings(next);
  }, [settings]);

  const restore = useCallback(async (data: { entries: Entry[]; categories: Category[] }) => {
    await store().replaceAll(data);
    setEntries(data.entries);
    setCategories(data.categories);
  }, []);

  const clearAll = useCallback(async () => {
    await store().clearAll();
    const fresh = await store().load();
    setEntries(fresh.entries);
    setCategories(fresh.categories);
    setSettings(fresh.settings);
  }, []);

  const signOut = useCallback(async () => {
    if (!CLOUD_ENABLED) return;
    const { getSupabase } = await import("@/lib/supabase/client");
    await getSupabase().auth.signOut();
    router.replace("/login");
  }, [router]);

  const deleteAccount = useCallback(async () => {
    const s = store();
    if (s instanceof SupabaseStore) {
      await s.deleteAccount();
      const { getSupabase } = await import("@/lib/supabase/client");
      await getSupabase().auth.signOut();
      router.replace("/login");
    } else {
      await s.clearAll();
      const fresh = await s.load();
      setEntries(fresh.entries);
      setCategories(fresh.categories);
      setSettings(fresh.settings);
    }
  }, [router]);

  const retry = useCallback(() => {
    setStatus("loading");
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo<LedgerContextValue>(
    () => ({
      status,
      error,
      mode: CLOUD_ENABLED ? "cloud" : "local",
      user,
      entries,
      categories,
      settings,
      addEntry,
      updateEntry,
      deleteEntry,
      addCategory,
      updateCategory,
      updateSettings,
      restore,
      clearAll,
      deleteAccount,
      signOut,
      retry,
    }),
    [
      status, error, user, entries, categories, settings,
      addEntry, updateEntry, deleteEntry, addCategory, updateCategory, updateSettings,
      restore, clearAll, deleteAccount, signOut, retry,
    ],
  );

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used inside LedgerProvider");
  return ctx;
}
