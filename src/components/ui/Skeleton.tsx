import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

/** A card-shaped placeholder with a few lines. */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4 sm:p-6", className)} aria-hidden>
      <Skeleton className="mb-4 h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("mb-3 h-4", i % 2 ? "w-2/3" : "w-5/6")} />
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
