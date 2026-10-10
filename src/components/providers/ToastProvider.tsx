"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ToastOptions {
  message: string;
  tone?: "success" | "error" | "info";
  action?: { label: string; onClick: () => void };
  /** Milliseconds before auto-dismiss. Defaults to 4000, or 10000 when an action is present. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, number>());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = nextId.current++;
      const duration = opts.duration ?? (opts.action ? 10000 : 4000);
      setItems((list) => [...list.slice(-2), { ...opts, id }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((t) => {
          const Icon = t.tone === "error" ? AlertCircle : t.tone === "success" ? CheckCircle2 : Info;
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-sm border border-border bg-surface px-3 py-2.5 shadow-float anim-pop",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  t.tone === "error" ? "text-danger-text" : t.tone === "success" ? "text-in-text" : "text-accent-text",
                )}
                aria-hidden
              />
              <p className="min-w-0 flex-1 text-sm text-fg">{t.message}</p>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="h-9 shrink-0 rounded-sm px-2 text-sm font-semibold text-accent-text hover:bg-accent-soft"
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-fg-3 hover:bg-surface-2 hover:text-fg"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
