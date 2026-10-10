export type EntryType = "in" | "out";

export type CategoryType = EntryType | "both";

/** A single ledger entry. `amount` is always integer paise. Dates are ISO `YYYY-MM-DD`. */
export interface Entry {
  id: string;
  type: EntryType;
  amount: number;
  date: string;
  categoryId: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  archived: boolean;
  createdAt: string;
}

export type ThemePreference = "system" | "light" | "dark";

export interface Settings {
  theme: ThemePreference;
  currency: "INR";
  lastType: EntryType;
  lastCategoryId: Record<EntryType, string | null>;
}

export interface LedgerData {
  entries: Entry[];
  categories: Category[];
  settings: Settings;
}

export interface BackupFile {
  app: "money-ledger";
  version: 1;
  exportedAt: string;
  entries: Entry[];
  categories: Category[];
  settings?: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  currency: "INR",
  lastType: "in",
  lastCategoryId: { in: null, out: null },
};
