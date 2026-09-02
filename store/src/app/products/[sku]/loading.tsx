import { Skeleton } from '@/components/ui/skeleton';

/**
 * אותה רשת בדיוק כמו העמוד האמיתי (במה ריבועית + עמודת 420) כדי שהמעבר
 * מטעינה לתוכן לא יזיז אף פיקסל.
 */
export default function Loading() {
  return (
    <>
      <div className="flex items-center gap-2 pb-6">
        <Skeleton className="h-5 w-24 rounded-[6px]" />
        <Skeleton className="h-5 w-16 rounded-[6px]" />
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="aspect-square rounded-[16px] border border-rule bg-panel-1" />

        <div className="rounded-[16px] border border-rule bg-panel-1 p-6">
          <Skeleton className="h-[11px] w-16 rounded-[4px]" />
          <Skeleton className="mt-3 h-8 w-full rounded-[6px]" />
          <Skeleton className="mt-2 h-8 w-2/3 rounded-[6px]" />
          <Skeleton className="mt-4 h-7 w-32 rounded-[6px]" />
          <Skeleton className="mt-4 h-5 w-20 rounded-[6px]" />
          <div className="mt-6 flex items-center gap-3 border-t border-rule pt-6">
            <Skeleton className="h-9 w-[104px] rounded-[8px]" />
            <Skeleton className="h-11 flex-1 rounded-[8px]" />
          </div>
          <Skeleton className="mt-5 h-5 w-56 rounded-[6px]" />
        </div>

        <div className="flex flex-col gap-12">
          <div>
            <Skeleton className="h-[11px] w-12 rounded-[4px]" />
            <div className="mt-4 rounded-[12px] border border-rule bg-panel-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-rule px-4 py-3 first:border-t-0">
                  <Skeleton className="h-6 w-4/5 rounded-[6px]" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-[11px] w-12 rounded-[4px]" />
            <Skeleton className="mt-4 h-6 w-full rounded-[6px]" />
            <Skeleton className="mt-2 h-6 w-full rounded-[6px]" />
            <Skeleton className="mt-2 h-6 w-3/4 rounded-[6px]" />
          </div>
        </div>
      </div>
    </>
  );
}
