import Link from 'next/link';
import { list } from '@/lib/airtable';
import type { Product, ProductFields } from '@/lib/types';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { EmptyState } from '@/components/empty-state';
import { ProductCard } from '@/components/product-card';
import { EntityDialog } from '@/components/forms/entity-dialog';
import { ActionButton } from '@/components/forms/action-button';
import { FieldError } from '@/components/forms/field-error';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createProduct, reindexProducts, toggleStock } from './actions';

export const dynamic = 'force-dynamic';

type SP = { q?: string; category?: string; view?: string };

function StockToggle({ p }: { p: Product }) {
  return (
    <ActionButton
      action={toggleStock.bind(null, p.id, !p.fields.InStock)}
      variant="ghost"
      className="gap-2 text-ink-2 -ms-2"
      aria-label={p.fields.InStock ? 'סימון כאזל' : 'סימון כזמין במלאי'}
    >
      <span aria-hidden className={`size-2 rounded-full ${p.fields.InStock ? 'bg-led-green shadow-[0_0_6px_var(--led-green)]' : 'bg-ink-3/40'}`} />
      {p.fields.InStock ? 'במלאי' : 'אזל'}
    </ActionButton>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = '', category = '', view = 'grid' } = await searchParams;
  const all = await list<ProductFields>('Products', { sort: [{ field: 'Category' }, { field: 'Name' }] });
  const categories = [...new Set(all.map((p) => p.fields.Category).filter(Boolean))] as string[];
  const needle = q.trim().toLowerCase();
  const products = all.filter(
    (p) =>
      (!category || p.fields.Category === category) &&
      (!needle ||
        (p.fields.Name ?? '').toLowerCase().includes(needle) ||
        (p.fields.Sku ?? '').toLowerCase().includes(needle) ||
        (p.fields.Description ?? '').toLowerCase().includes(needle)),
  );
  const qs = (patch: Partial<SP>) => {
    const s = new URLSearchParams({ q, category, view, ...patch } as Record<string, string>);
    for (const [k, v] of [...s.entries()]) if (!v) s.delete(k);
    const str = s.toString();
    return `/products${str ? `?${str}` : ''}`;
  };

  return (
    <>
      <Header
        title="מוצרים"
        actions={
          <>
            <ActionButton action={reindexProducts} pendingText="מעדכן…" variant="secondary" size="default">
              רענון מאגר ידע
            </ActionButton>
            <EntityDialog
              trigger="מוצר חדש"
              title="מוצר חדש"
              description="אחרי ההוספה לחץ על &quot;רענון מאגר ידע&quot; כדי שסוכן השירות יכיר את המוצר."
              action={createProduct}
              successMessage="המוצר נוסף"
              submitLabel="הוספה"
            >
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="p-name">שם</Label>
                  <Input id="p-name" name="Name" required autoFocus />
                  <FieldError name="Name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-sku">מק״ט</Label>
                  <Input id="p-sku" name="Sku" dir="ltr" spellCheck={false} placeholder="TY-XX-000" className="font-mono uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="p-cat">קטגוריה</Label>
                  <Input id="p-cat" name="Category" list="categories" required />
                  <datalist id="categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <FieldError name="Category" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-price">מחיר (₪, כולל מע״מ)</Label>
                  <Input id="p-price" name="Price" type="number" step="0.01" min="0" inputMode="decimal" className="num" required />
                  <FieldError name="Price" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-desc">תיאור (מוזן לסוכן השירות)</Label>
                <textarea id="p-desc" name="Description" rows={3} className="w-full rounded-md border border-input bg-well px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="InStock" defaultChecked className="size-4 accent-signal" /> במלאי
              </label>
            </EntityDialog>
          </>
        }
      />

      <form className="flex flex-wrap items-center gap-2 mb-5" role="search">
        <input type="hidden" name="view" value={view} />
        <Input name="q" defaultValue={q} placeholder="חיפוש בשם, מק״ט או תיאור" className="max-w-xs" aria-label="חיפוש" />
        <select name="category" defaultValue={category} aria-label="קטגוריה" className="h-9 rounded-md border border-input bg-well px-3 text-sm">
          <option value="">כל הקטגוריות</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          סינון
        </Button>
        {(q || category) && (
          <Link href={qs({ q: '', category: '' })} className="text-sm text-inkblue">
            נקה
          </Link>
        )}
        <div className="ms-auto flex items-center gap-3">
          <span className="text-xs text-ink-3 num">
            {products.length} מתוך {all.length}
          </span>
          <div role="group" aria-label="תצוגה" className="inline-flex rounded-md border border-rule p-0.5 bg-paper-3">
            {(
              [
                ['grid', 'כרטיסים'],
                ['table', 'טבלה'],
              ] as const
            ).map(([v, label]) => (
              <Link
                key={v}
                href={qs({ view: v })}
                aria-current={view === v ? 'page' : undefined}
                className={`h-7 px-3 inline-flex items-center rounded text-xs transition-colors ${
                  view === v ? 'bg-paper-2 text-ink shadow-[0_0_0_1px_var(--rule)]' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </form>

      {products.length === 0 ? (
        <div className="panel">
          <EmptyState illustration="products" title="אין מוצרים" hint={q || category ? 'נסה סינון אחר' : 'הוסף מוצר ראשון'} />
        </div>
      ) : view === 'table' ? (
        <div className="panel overflow-hidden">
          <Table label="מוצרים" className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]" />
                <TableHead className="w-[110px]">מק״ט</TableHead>
                <TableHead className="w-[22%]">שם</TableHead>
                <TableHead className="w-[11%]">קטגוריה</TableHead>
                <TableHead className="w-[10%]">מחיר</TableHead>
                <TableHead className="w-[12%]">מלאי</TableHead>
                <TableHead>תיאור</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="py-2">
                    {p.fields.ImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.fields.ImageUrl} alt="" width={40} height={40} className="size-10 rounded-md object-cover border border-rule" loading="lazy" />
                    )}
                  </TableCell>
                  <TableCell dir="ltr" className="text-end font-mono text-xs text-ink-2">
                    {p.fields.Sku ?? '—'}
                  </TableCell>
                  <TableCell className="font-medium whitespace-normal">{p.fields.Name}</TableCell>
                  <TableCell className="text-ink-2">{p.fields.Category ?? '—'}</TableCell>
                  <TableCell>
                    <Money value={p.fields.Price ?? 0} />
                  </TableCell>
                  <TableCell>
                    <StockToggle p={p} />
                  </TableCell>
                  <TableCell className="text-ink-2 text-sm whitespace-normal">
                    <span className="line-clamp-2" title={p.fields.Description}>
                      {p.fields.Description ?? '—'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} action={<StockToggle p={p} />} />
          ))}
        </div>
      )}
    </>
  );
}
