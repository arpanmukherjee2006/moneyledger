import type { ReactNode } from "react";
import { LedgerProvider } from "@/components/providers/LedgerProvider";
import { QuickAddProvider } from "@/components/providers/QuickAddProvider";
import { AppShell } from "@/components/shell/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <LedgerProvider>
      <QuickAddProvider>
        <AppShell>{children}</AppShell>
      </QuickAddProvider>
    </LedgerProvider>
  );
}
