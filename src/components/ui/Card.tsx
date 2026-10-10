import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}

export function CardHeader({ title, description, action, as: Tag = "h2", className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5", className)}>
      <div className="min-w-0">
        <Tag className="text-base font-semibold text-fg">{title}</Tag>
        {description && <p className="mt-0.5 text-sm text-fg-3">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-4 py-4 sm:px-6 sm:py-5", className)} {...rest}>
      {children}
    </div>
  );
}
