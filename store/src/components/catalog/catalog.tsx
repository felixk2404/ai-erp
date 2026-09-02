'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { LayoutGridIcon, Rows3Icon, SearchIcon, SearchXIcon, XIcon } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/catalog/product-card';
import { SpecGrid } from '@/components/catalog/spec-grid';
import { catalogQuery, filterProducts, type CatalogParams, type Sort, type View } from '@/lib/catalog-filter';
import type { Product } from '@/lib/types';

const SORT_LABELS: Record<Sort, string> = {
  name: 'לפי שם',
  'price-asc': 'מחיר — מהזול',
  'price-desc': 'מחיר — מהיקר',
};

const VIEW_BUTTONS = [
  { id: 'grid' as const, Icon: LayoutGridIcon, label: 'תצוגת רשת' },
  { id: 'spec' as const, Icon: Rows3Icon, label: 'תצוגת מפרט' },
];

const PILL_SPRING = { type: 'spring' as const, bounce: 0.2, visualDuration: 0.3 };

/**
 * שורת הבקרה צפופה ודביקה מתחת לכותרת — כל הפקדים בגובה 40 אחיד, כדי שהיד
 * תמצא אותם בלי לחפש; מתחתיה אוויר נדיב, והרשת עצמה היא נקודת המבט היחידה.
 * ה-URL הוא מקור האמת (`?c=&q=&sort=&view=`) כדי שסינון יהיה לינק לשיתוף,
 * והמצב ההתחלתי מגיע מהשרת כדי שלא יהיה הבהוב הידרציה.
 */
export function Catalog({
  products,
  categories,
  initial,
}: {
  products: Product[];
  categories: string[];
  initial: CatalogParams;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [c, setC] = useState(initial.c);
  const [q, setQ] = useState(initial.q);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [view, setView] = useState<View>(initial.view);

  const results = useMemo(() => filterProducts(products, { c, q, sort }), [products, c, q, sort]);

  // כתיבה ל-URL אחרי 150ms שקט: הקלדה לא מציפה את ההיסטוריה, והסינון עצמו מיידי.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const id = setTimeout(() => {
      const qs = catalogQuery({ c, q, sort, view });
      startTransition(() => router.replace(qs ? `/products?${qs}` : '/products', { scroll: false }));
    }, 150);
    return () => clearTimeout(id);
  }, [c, q, sort, view, router]);

  const pills = ['', ...categories];
  const filtered = Boolean(c || q);
  const clear = () => {
    setC('');
    setQ('');
  };

  return (
    <>
      <div className="sticky top-16 z-30 -mx-5 flex flex-col gap-3 border-b border-rule bg-void/95 px-5 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex h-10 w-full items-center sm:w-auto sm:flex-1">
            <SearchIcon
              size={16}
              strokeWidth={1.75}
              aria-hidden
              className="pointer-events-none absolute start-3 text-glow-3"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setQ('')}
              placeholder="חיפוש לפי שם, מק״ט או תיאור"
              aria-label="חיפוש בקטלוג"
              className="h-10 w-full rounded-[8px] border border-rule-strong bg-panel-1 ps-9 pe-9 text-[14px] text-glow placeholder:text-glow-4 [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="ניקוי חיפוש"
                className="absolute end-1 grid size-8 place-items-center rounded-[6px] text-glow-3 transition-colors hover:text-glow"
              >
                <XIcon size={14} strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>

          <div className="flex flex-1 items-center gap-2 sm:ms-auto sm:flex-none">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="מיון"
              className="h-10 flex-1 rounded-[8px] border border-rule-strong bg-panel-1 px-3 text-[14px] text-glow-2 sm:flex-none"
            >
              {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>

            <div className="flex h-10 shrink-0 items-center overflow-hidden rounded-[8px] border border-rule-strong">
              {VIEW_BUTTONS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  aria-pressed={view === id}
                  aria-label={label}
                  className={`grid size-10 place-items-center transition-colors ${
                    view === id ? 'bg-panel-3 text-beam' : 'text-glow-3 hover:bg-panel-2 hover:text-glow'
                  }`}
                >
                  <Icon size={16} strokeWidth={1.75} aria-hidden />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="relative min-w-0 flex-1">
            <div className="-mb-1 flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
              {pills.map((cat) => {
                const active = c === cat;
                return (
                  <button
                    key={cat || 'all'}
                    type="button"
                    onClick={() => setC(cat)}
                    aria-pressed={active}
                    className="relative grid h-10 shrink-0 place-items-center rounded-[8px] px-3.5 text-[14px] font-medium"
                  >
                    {active && (
                      <motion.span
                        layoutId="catalog-pill"
                        aria-hidden
                        transition={PILL_SPRING}
                        className="absolute inset-0 rounded-[8px] bg-beam-soft"
                      />
                    )}
                    <span
                      className={`relative whitespace-nowrap transition-colors ${active ? 'text-beam' : 'text-glow-3 hover:text-glow'}`}
                    >
                      {cat || 'הכל'}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* RTL: העודף גולש לצד ה-end — דהייה שם היא הרמז שיש עוד קטגוריות. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-linear-to-r from-void to-transparent"
            />
          </div>
          <p aria-live="polite" className="shrink-0 text-[14px] text-glow-3">
            <span className="num text-glow-2">{results.length}</span> {results.length === 1 ? 'מוצר' : 'מוצרים'}
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <span
            aria-hidden
            className="grid size-12 place-items-center rounded-full border border-rule bg-panel-1 text-glow-4"
          >
            <SearchXIcon size={20} strokeWidth={1.5} />
          </span>
          <p className="max-w-sm text-[18px] text-glow-2">{`לא נמצא כלום ל־"${q || c}"`}</p>
          <Button variant="outline" onClick={clear} className="h-10 rounded-[8px] px-4 text-[14px]">
            נקה סינון
          </Button>
        </div>
      ) : view === 'spec' ? (
        <div className="pt-8">
          <SpecGrid products={results} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((p, i) => (
            <Reveal key={p.fields.Sku ?? p.id} delay={Math.min(i * 0.04, 0.4)} className="h-full">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}

      {filtered && results.length > 0 && (
        <div className="flex justify-center pt-10">
          <Button variant="ghost" onClick={clear} className="h-10 rounded-[8px] px-4 text-[14px] text-glow-3">
            נקה סינון
          </Button>
        </div>
      )}
    </>
  );
}
