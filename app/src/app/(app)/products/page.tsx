import Link from 'next/link';
import { list } from '@/lib/airtable';
import type { ProductFields } from '@/lib/types';
import { Header } from '@/components/shell/header';
import { Money } from '@/components/money';
import { EmptyState } from '@/components/empty-state';
import { EntityDialog } from '@/components/forms/entity-dialog';
import { ActionButton } from '@/components/forms/action-button';
import { FieldError } from '@/components/forms/field-error';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createProduct, reindexProducts, toggleStock } from './actions';

export const dynamic = 'force-dynamic';

type SP = { q?: string; category?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { q = '', category = '' } = await searchParams;
  const all = await list<ProductFields>('Products', { sort: [{ field: 'Category' }, { field: 'Name' }] });
  const categories = [...new Set(all.map((p) => p.fields.Category).filter(Boolean))] as string[];
  const needle = q.trim().toLowerCase();
  const products = all.filter(
    (p) =>
      (!category || p.fields.Category === category) &&
      (!needle || p.fields.Name.toLowerCase().includes(needle) || (p.fields.Description ?? '').toLowerCase().includes(needle)),
  );

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
              description='אחרי הוספה לחצו על "רענון מאגר ידע" כדי שסוכן השירות יכיר את המוצר.'
              action={createProduct}
              successMessage="המוצר נוסף"
              submitLabel="הוספה"
            >
              <>
                <div className="space-y-2">
                  <Label htmlFor="p-name">שם</Label>
                  <Input id="p-name" name="Name" required autoFocus />
                  <FieldError name="Name" />
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
                  <textarea
                    id="p-desc"
                    name="Description"
                    rows={3}
                    className="w-full rounded-md border border-input bg-paper-3 px-3 py-2 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="InStock" defaultChecked className="size-4 accent-inkblue" /> במלאי
                </label>
              </>
            </EntityDialog>
          </>
        }
      />

      <form className="flex flex-wrap items-center gap-2 mb-4" role="search">
        <Input name="q" defaultValue={q} placeholder="חיפוש בשם או בתיאור" className="max-w-xs" aria-label="חיפוש" />
        <select
          name="category"
          defaultValue={category}
          aria-label="קטגוריה"
          className="h-9 rounded-md border border-input bg-paper-3 px-3 text-sm"
        >
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
          <Link href="/products" className="text-sm text-inkblue">
            נקה
          </Link>
        )}
        <span className="text-xs text-ink-3 ms-auto num">
          {products.length} מתוך {all.length}
        </span>
      </form>

      <div className="bg-paper-2 border border-rule rounded-lg overflow-hidden">
        {products.length === 0 ? (
          <EmptyState title="אין מוצרים" hint={q || category ? 'נסה סינון אחר' : 'הוסף מוצר ראשון'} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>מחיר</TableHead>
                <TableHead>מלאי</TableHead>
                <TableHead className="w-[40%]">תיאור</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.fields.Name}</TableCell>
                  <TableCell className="text-ink-2">{p.fields.Category ?? '—'}</TableCell>
                  <TableCell>
                    <Money value={p.fields.Price ?? 0} />
                  </TableCell>
                  <TableCell>
                    <ActionButton
                      action={toggleStock.bind(null, p.id, !p.fields.InStock)}
                      variant="ghost"
                      className="gap-2 text-ink-2 -ms-2"
                      aria-label={p.fields.InStock ? 'סמן לא במלאי' : 'סמן במלאי'}
                    >
                      <span
                        aria-hidden
                        className={`size-2 rounded-full ${p.fields.InStock ? 'bg-led-green shadow-[0_0_6px_var(--led-green)]' : 'bg-ink-3/40'}`}
                      />
                      {p.fields.InStock ? 'במלאי' : 'אין במלאי'}
                    </ActionButton>
                  </TableCell>
                  <TableCell className="text-ink-2 text-sm">
                    <span className="line-clamp-2" title={p.fields.Description}>
                      {p.fields.Description ?? '—'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
