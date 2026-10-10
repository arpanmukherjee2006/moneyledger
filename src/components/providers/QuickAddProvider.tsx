"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { Entry } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { EntryForm } from "@/components/ledger/EntryForm";

interface QuickAddContextValue {
  /** Open the sheet to add a new entry, or to edit `entry`. */
  open: (entry?: Entry) => void;
  close: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; entry?: Entry; key: number }>({ open: false, key: 0 });
  const amountRef = useRef<HTMLInputElement>(null);

  const open = useCallback((entry?: Entry) => setState((s) => ({ open: true, entry, key: s.key + 1 })), []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <Sheet
        open={state.open}
        onClose={close}
        title={state.entry ? "Edit entry" : "Add entry"}
        initialFocusRef={amountRef}
      >
        <EntryForm key={state.key} initial={state.entry} onDone={close} amountRef={amountRef} />
      </Sheet>
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd(): QuickAddContextValue {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used inside QuickAddProvider");
  return ctx;
}
