import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-fg-3" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
