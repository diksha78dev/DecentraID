import { cn } from '../../utils/cn';

/** Placeholder that holds the shape of content while it loads. */
export default function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded bg-canvas', className)} />;
}

export function TableSkeleton({ rows = 4 }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="ml-auto h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
