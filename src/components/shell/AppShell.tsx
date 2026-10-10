"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, List, Plus, Settings, WalletMinimal, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useQuickAdd } from "@/components/providers/QuickAddProvider";
import { useLedger } from "@/components/providers/LedgerProvider";
import { Button } from "@/components/ui/Button";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/entries", label: "Entries", icon: List },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { open } = useQuickAdd();
  const { status, error, retry } = useLedger();

  return (
    <div className="min-h-dvh bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2 focus:shadow-float"
      >
        Skip to content
      </a>

      {/* Desktop and tablet sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-border bg-surface px-3 py-6 sm:flex lg:w-64 lg:px-4">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 text-fg lg:justify-start lg:px-2" aria-label="Money Ledger home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent text-on-accent">
            <WalletMinimal className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden text-base font-semibold lg:inline">Money Ledger</span>
        </Link>
        <Button size="lg" fullWidth icon={<Plus className="h-5 w-5" aria-hidden />} onClick={() => open()} aria-label="Add entry" className="px-0 lg:px-5">
          <span className="hidden lg:inline">Add entry</span>
        </Button>
        <nav aria-label="Main" className="mt-6 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                title={label}
                className={cn(
                  "flex h-11 items-center justify-center gap-3 rounded-sm px-3 text-sm font-medium transition-colors duration-150 lg:justify-start",
                  active ? "bg-accent-soft text-accent-text" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
                <span className="sr-only lg:not-sr-only">{label}</span>
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto hidden px-2 text-xs text-fg-3 lg:block">Amounts in INR. Totals are always computed from your entries.</p>
      </aside>

      {/* Content */}
      <main id="main" className="w-full px-4 pb-28 pt-4 sm:pl-28 sm:pr-8 sm:pb-12 sm:pt-8 lg:pl-72">
        <div className="mx-auto w-full max-w-[1120px]">
        {status === "error" ? (
          <div className="mx-auto mt-16 max-w-md rounded-lg border border-border bg-surface p-6 text-center shadow-card" role="alert">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-danger-text" aria-hidden />
            <h1 className="text-lg font-semibold">Could not load your ledger</h1>
            <p className="mt-1 text-sm text-fg-2">{error}</p>
            <Button className="mt-5" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : (
          children
        )}
        </div>
      </main>

      {/* Mobile bottom navigation with centred quick-add */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-safe sm:hidden"
      >
        <ul className="grid h-16 grid-cols-5 items-center">
          {NAV.slice(0, 2).map((item) => (
            <MobileNavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => open()}
              aria-label="Add entry"
              className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-float transition-transform duration-150 active:scale-95"
            >
              <Plus className="h-7 w-7" aria-hidden />
            </button>
          </li>
          {NAV.slice(2).map((item) => (
            <MobileNavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </ul>
      </nav>
    </div>
  );
}

function MobileNavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <li className="h-full">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none",
          active ? "text-accent-text" : "text-fg-3",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} aria-hidden />
        {label}
      </Link>
    </li>
  );
}
