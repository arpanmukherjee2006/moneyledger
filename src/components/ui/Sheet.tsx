"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Element to focus when the sheet opens. Falls back to the first focusable control. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  size?: "md" | "lg";
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet on phones, centred modal on larger screens. Traps focus, closes on
 * Escape or backdrop click, and restores focus to the opener.
 */
export function Sheet({ open, onClose, title, description, children, initialFocusRef, size = "md" }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const target = initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      openerRef.current?.focus?.();
    };
  }, [open, onClose, initialFocusRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="backdrop absolute inset-0 anim-fade" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        aria-describedby={description ? "sheet-desc" : undefined}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col bg-surface shadow-sheet",
          "rounded-t-lg sm:rounded-lg sm:shadow-float anim-slide-up sm:anim-pop",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-4 pt-3 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <h2 id="sheet-title" className="text-lg font-semibold text-fg">
              {title}
            </h2>
            {description && (
              <p id="sheet-desc" className="mt-0.5 text-sm text-fg-3">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </div>
        <div className="scroll-thin overflow-y-auto px-4 pb-4 pt-4 pb-safe sm:px-6 sm:pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
