"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { ThemePreference } from "@/lib/types";

export const THEME_STORAGE_KEY = "ml-theme";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Inline script that runs before paint so the first frame already has the right theme. */
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=p==="light"||p==="dark"?p:(d?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

/* The theme lives outside React (localStorage + the OS setting), so it is read through an external store. */

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage unavailable */
  }
  return "system";
}

function systemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

type Snapshot = `${ThemePreference}:${"light" | "dark"}`;

function getSnapshot(): Snapshot {
  return `${readPreference()}:${systemTheme()}`;
}

function getServerSnapshot(): Snapshot {
  return "system:light";
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    mq.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [preference, system] = snapshot.split(":") as [ThemePreference, "light" | "dark"];
  const resolved = preference === "system" ? system : preference;

  // Keep the document attribute in sync with the resolved theme.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  const setPreference = useCallback((p: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, p);
    } catch {
      /* ignore */
    }
    for (const l of listeners) l();
  }, []);

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
