import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';

/**
 * מק"ט שלא קיים — משפט אחד ופעולה אחת, בלי איורים ובלי התנצלויות.
 * אותה טיפוגרפיה של עמוד המוצר כדי שהמעבר לא ירגיש כמו אתר אחר.
 */
export default function ProductNotFound() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-start justify-center gap-4">
      <p className="num text-[11px] leading-none tracking-[0.14em] text-glow-3">404</p>
      <h1 className="text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] sm:text-[44px]">
        המוצר לא נמצא
      </h1>
      <p className="max-w-[48ch] text-glow-2">
        ייתכן שהמק״ט השתנה או שהפריט ירד מהמדף. אפשר לחפש אותו בקטלוג.
      </p>
      <Link
        href="/products"
        transitionTypes={['nav-back']}
        className="mt-2 inline-flex h-11 items-center gap-1.5 rounded-[8px] bg-beam px-4 text-[14px] font-medium text-void transition-colors hover:bg-beam/80"
      >
        <ArrowRightIcon size={14} strokeWidth={2} aria-hidden />
        לכל המוצרים
      </Link>
    </div>
  );
}
