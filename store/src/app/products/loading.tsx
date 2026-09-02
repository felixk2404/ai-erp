import { Skeleton } from '@/components/ui/skeleton';

const CARDS = Array.from({ length: 8 }, (_, i) => i);
const PILLS = ['w-14', 'w-20', 'w-16', 'w-24', 'w-20'];

/**
 * אותן מידות בדיוק כמו הכרטיס האמיתי (4:3 + 198px תוכן) כדי שהמעבר
 * מטעינה לתוכן לא יזיז אף פיקסל.
 */
export default function Loading() {
  return (
    <>
      <div className="pb-6">
        <Skeleton className="h-[11px] w-16 rounded-sm" />
        <Skeleton className="mt-2 h-[30px] w-40 rounded-sm sm:h-[46px] sm:w-52" />
        <Skeleton className="mt-2 h-5 w-72 max-w-full rounded-sm" />
      </div>

      <div className="-mx-5 flex flex-col gap-3 border-b border-rule px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-full rounded-sm sm:max-w-[360px] sm:flex-1" />
          <Skeleton className="h-10 w-[150px] rounded-sm" />
          <Skeleton className="h-10 w-20 rounded-sm" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-1 overflow-hidden">
            {PILLS.map((w, i) => (
              <Skeleton key={i} className={`h-10 shrink-0 rounded-sm ${w}`} />
            ))}
          </div>
          <Skeleton className="h-5 w-20 shrink-0 rounded-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((i) => (
          <div key={i} className={`overflow-hidden rounded-lg border border-rule bg-panel-1 ${i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`}>
            <div className="aspect-3/2 bg-panel-2 sm:aspect-4/3" />
            <div className="p-4">
              <Skeleton className="h-[11px] w-14 rounded-sm" />
              <Skeleton className="mt-2 h-[21px] w-full rounded-sm" />
              <Skeleton className="mt-2 h-[21px] w-3/5 rounded-sm" />
              <Skeleton className="mt-1 h-5 w-4/5 rounded-sm" />
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-rule pt-4">
                <Skeleton className="h-5 w-16 rounded-sm" />
                <Skeleton className="h-10 w-[150px] rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
