import { Skeleton } from '@/components/ui/skeleton';

/**
 * אותה רשת בדיוק כמו העמוד האמיתי (במה 640 ריבועית + עמודת 420, אותו justify-between)
 * כדי שהמעבר מטעינה לתוכן לא יזיז אף פיקסל.
 */
export default function Loading() {
  return (
    <>
      <div className="flex items-center gap-2 pb-6">
        <Skeleton className="h-5 w-24 rounded-sm" />
        <Skeleton className="h-5 w-16 rounded-sm" />
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,640px)_420px] lg:justify-between">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="aspect-square rounded-lg border border-rule bg-panel-1" />
        </div>

        <div className="rounded-lg border border-rule bg-panel-1 p-6 lg:col-start-2 lg:row-start-1">
          <Skeleton className="h-[11px] w-16 rounded-sm" />
          <Skeleton className="mt-4 h-8 w-full rounded-sm" />
          <Skeleton className="mt-2 h-8 w-2/3 rounded-sm" />
          <Skeleton className="mt-4 h-7 w-32 rounded-sm" />
          <Skeleton className="mt-4 h-5 w-20 rounded-sm" />
          <div className="mt-6 flex items-center gap-3 border-t border-rule pt-6">
            <Skeleton className="h-9 w-[104px] rounded-sm" />
            <Skeleton className="h-11 flex-1 rounded-sm" />
          </div>
          <Skeleton className="mt-4 h-5 w-56 rounded-sm" />
        </div>

        <div className="flex min-w-0 flex-col gap-12 lg:col-start-1 lg:row-start-2">
          <div>
            <Skeleton className="h-[11px] w-12 rounded-sm" />
            <div className="mt-4 rounded-md border border-rule bg-panel-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-rule px-4 py-3 first:border-t-0">
                  <Skeleton className="h-6 w-4/5 rounded-sm" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-[11px] w-12 rounded-sm" />
            <Skeleton className="mt-4 h-6 w-full rounded-sm" />
            <Skeleton className="mt-2 h-6 w-full rounded-sm" />
            <Skeleton className="mt-2 h-6 w-3/4 rounded-sm" />
          </div>
        </div>
      </div>
    </>
  );
}
