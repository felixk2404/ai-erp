import { Skeleton } from '@/components/ui/skeleton';

/**
 * דף הבית מחכה ל-Airtable לפני הבייט הראשון: `getProducts()` מוזרם לתוך
 * `flagshipOf`, כך שגם ה-hero — מועמד ה-LCP של האתר — תלוי בו. גבול הזרימה הזה
 * מוציא את המעטפת לרשת מיד, ומצייר את אותה רשת של ה-hero כדי שהמעבר לא יזיז
 * פיקסלים: 80dvh, אותם `gap`, אותה עמודה של דיסקה ב-lg.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-16 lg:gap-24" aria-busy>
      <div className="-mt-8 mx-[calc(50%-50vw)] border-b border-rule px-[max(20px,calc(50vw-640px))] pt-12 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid min-h-[80dvh] content-center items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-rows-[auto_auto]">
          <div className="order-2 flex flex-col items-start lg:order-none lg:col-start-1 lg:row-start-1" aria-hidden>
            <Skeleton className="h-[11px] w-48 rounded-sm" />
            <Skeleton className="mt-5 h-[42px] w-[9ch] min-w-[220px] rounded-sm sm:h-[76px]" />
            <Skeleton className="mt-5 h-7 w-[34ch] max-w-full rounded-sm" />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Skeleton className="h-12 w-40 rounded-md" />
              <Skeleton className="h-12 w-36 rounded-md" />
            </div>
          </div>
          <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1" aria-hidden>
            <Skeleton className="mx-auto aspect-square w-full max-w-[500px] rounded-full" />
          </div>
        </div>
      </div>
      <span className="sr-only">טוענים את חדר התצוגה…</span>
    </div>
  );
}
