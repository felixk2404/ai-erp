'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { LayoutGridIcon, Rows3Icon, SearchIcon, SearchXIcon, XIcon } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/catalog/product-card';
import { SpecGrid } from '@/components/catalog/spec-grid';
import { catalogQuery, filterProducts, gridPlan, pickLead, type CatalogParams, type Sort, type View } from '@/lib/catalog-filter';
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
  const plan = gridPlan(results.length);
  // המוביל נבחר לפי ערך ולא לפי מיקום במיון, ומורם לראש הרשימה;
  // שאר הכרטיסים נשארים בסדר שהמשתמש ביקש.
  const lead = plan.lead ? pickLead(results) : null;
  const ordered = lead ? [lead, ...results.filter((x) => x !== lead)] : results;

  const prev = useRef<CatalogParams | null>(null);
  useEffect(() => {
    const next: CatalogParams = { c, q, sort, view };
    const before = prev.current;
    prev.current = next;
    if (!before) return;
    const qs = catalogQuery(next);
    const url = qs ? `/products?${qs}` : '/products';
    if (before.c === c && before.sort === sort && before.view === view) {
      const id = setTimeout(() => window.history.replaceState(null, '', url), 300);
      return () => clearTimeout(id);
    }
    startTransition(() => router.replace(url, { scroll: false }));
  }, [c, q, sort, view, router]);

  // הדהייה בקצה רשימת הקטגוריות היא רמז שיש עוד — ולכן מוצגת רק כשבאמת יש עוד.
  const [overflows, setOverflows] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const measure = useCallback((el: HTMLDivElement | null) => {
    scroller.current = el;
    if (el) setOverflows(el.scrollWidth > el.clientWidth + 1);
  }, []);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setOverflows(el.scrollWidth > el.clientWidth + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pills = ['', ...categories];
  const filtered = Boolean(c || q);
  const clear = () => {
    setC('');
    setQ('');
  };

  return (
    <>
      <div className="sticky top-16 z-20 -mx-5 flex flex-col gap-3 border-b border-rule bg-void/95 px-5 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex h-10 w-full items-center sm:w-auto sm:max-w-[360px] sm:flex-1">
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
              className="h-10 w-full rounded-sm border border-rule-strong bg-void ps-9 pe-9 text-[14px] text-glow placeholder:text-glow-4 [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="ניקוי חיפוש"
                className="absolute end-1 grid size-8 place-items-center rounded-sm text-glow-3 transition-colors hover:text-glow"
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
              className="h-10 flex-1 rounded-sm border border-rule-strong bg-void px-3 text-[14px] text-glow-2 sm:flex-none"
            >
              {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>

            <div className="flex h-10 shrink-0 items-center overflow-hidden rounded-sm border border-rule-strong">
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
            <div
              ref={measure}
              role="group"
              aria-label="קטגוריות"
              className="-mb-1 flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none]"
            >
              {pills.map((cat) => {
                const active = c === cat;
                return (
                  <button
                    key={cat || 'all'}
                    type="button"
                    onClick={() => setC(cat)}
                    aria-pressed={active}
                    className="relative grid h-10 shrink-0 place-items-center rounded-sm px-3.5 text-[14px] font-medium"
                  >
                    {active && (
                      <motion.span
                        layoutId="catalog-pill"
                        aria-hidden
                        transition={PILL_SPRING}
                        className="absolute inset-0 rounded-sm border border-beam/40 bg-beam-soft"
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
            {overflows && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-linear-to-r from-void/95 to-transparent"
              />
            )}
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
            className="grid size-12 place-items-center rounded-full border border-rule bg-panel-1 text-glow-3"
          >
            <SearchXIcon size={20} strokeWidth={1.5} />
          </span>
          <p className="max-w-sm text-[18px] text-glow-2">{`לא נמצא כלום ל־"${q || c}"`}</p>
          <Button variant="outline" onClick={clear} className="h-10 rounded-md border-rule-strong bg-transparent px-4 text-[14px] text-glow-2 dark:bg-transparent dark:hover:bg-panel-2">
            נקה סינון
          </Button>
        </div>
      ) : view === 'spec' ? (
        <div className="pt-8">
          <SpecGrid products={results} />
        </div>
      ) : (
        <div className={`grid gap-4 pt-8 ${plan.columns}`}>
          {ordered.map((p, i) => {
            const cls = `h-full ${plan.lead && i === 0 ? 'lg:col-span-2' : ''}`;
            const card = <ProductCard product={p} variant={plan.lead && i === 0 ? 'lead' : 'default'} />;
            // הכרטיס הראשון כבר במסך בטעינה, והוא מועמד ה-LCP. כניסה שמתחילה רק
            // אחרי ההידרציה דוחה את הציור שלו ב~1.5 שניות; מה שכבר כאן מגיע מוכן.
            return i === 0 ? (
              <div key={p.fields.Sku ?? p.id} className={cls}>
                {card}
              </div>
            ) : (
              <Reveal key={p.fields.Sku ?? p.id} delay={Math.min(i * 0.04, 0.4)} className={cls}>
                {card}
              </Reveal>
            );
          })}
        </div>
      )}

      {/* הכפתור יושב מתחת לרשת: כשהיא צרה (פחות מ-4 תוצאות) הוא נצמד לקצה ההתחלה איתה. */}
      {filtered && results.length > 0 && (
        <div className={`flex pt-10 ${plan.lead ? 'justify-center' : 'justify-center sm:justify-start'}`}>
          <Button variant="ghost" onClick={clear} className="h-10 rounded-md px-4 text-[14px] text-glow-3">
            נקה סינון
          </Button>
        </div>
      )}
    </>
  );
}
