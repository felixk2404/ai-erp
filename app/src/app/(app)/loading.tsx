import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div aria-busy="true">
      <span className="sr-only">טוען</span>
      <Skeleton className="h-7 w-40 mb-8" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
