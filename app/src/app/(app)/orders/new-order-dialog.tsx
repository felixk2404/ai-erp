'use client';

import { useActionState, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createOrder } from './actions';
import type { FormState } from '@/components/forms/entity-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmitButton } from '@/components/forms/submit-button';
import { FieldError } from '@/components/forms/field-error';
import { Money } from '@/components/money';
import { round2, sumItems, type ProductOption } from '@/lib/invoice-items';
import { MAX_LINES, MAX_QTY } from './parse';

type Row = { id: number; sku: string; qty: number };
const fresh = (): Row[] => [{ id: 1, sku: '', qty: 1 }];

/**
 * הזמנה שהמנהל מקליד — אותו מסלול WF13 `order` → WF10 כמו בחנות. הטופס שולח רק מק"ט וכמות;
 * המחיר, המשלוח והמע"מ נקבעים בשרת מהקטלוג, ולכן הסכום כאן הוא "משוער" בלבד.
 */
export function NewOrderDialog({ products }: { products: ProductOption[] }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>(fresh);
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await createOrder(prev, fd);
    if (result?.ok) {
      toast.success('ההזמנה נוצרה. החשבונית והמייל ללקוח בדרך.');
      setOpen(false);
      setRows(fresh());
    } else if (result?.error) {
      toast.error(result.error);
    }
    return result;
  }, undefined);

  const bySku = new Map(products.map((p) => [p.sku, p]));
  const chosen = rows.flatMap((r) => {
    const p = bySku.get(r.sku);
    return p ? [{ sku: p.sku, name: p.name, qty: r.qty, price: p.price }] : [];
  });
  const estimate = sumItems(chosen);

  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => (rs.length < MAX_LINES ? [...rs, { id: Date.now(), sku: '', qty: 1 }] : rs));
  const removeRow = (id: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n || 1)));

  const cols = 'grid grid-cols-[minmax(0,1fr)_72px_110px_36px] gap-2 px-3';
  const field = (name: string, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`order-${name}`}>{label}</Label>
      <Input id={`order-${name}`} name={name} {...props} />
      <FieldError msg={state?.errors?.[name]} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button data-hotkey="new" />}>הזמנה חדשה</DialogTrigger>
      <DialogContent dir="rtl" className="sm:max-w-2xl">
        <DialogHeader className="text-start pe-8">
          <DialogTitle>הזמנה חדשה</DialogTitle>
          <DialogDescription>אותו מסלול כמו בחנות: תמחור מהקטלוג, מלאי, חשבונית ומייל אישור ללקוח.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {field('name', 'שם הלקוח', { required: true, autoFocus: true })}
            {field('email', 'אימייל', { type: 'email', dir: 'ltr', required: true })}
            {field('phone', 'טלפון', { type: 'tel', dir: 'ltr', inputMode: 'tel', placeholder: '050-1234567', required: true })}
            {field('city', 'עיר')}
            <div className="sm:col-span-2">{field('address', 'כתובת למשלוח', { placeholder: 'נדרשת אם יש מוצר פיזי' })}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>פריטים</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addRow} disabled={rows.length >= MAX_LINES}>
                <Plus className="size-4" /> הוספת שורה
              </Button>
            </div>
            <div className="border border-rule rounded-md divide-y divide-rule">
              <div className={`${cols} py-1.5 text-[12px] tracking-wide text-ink-3`}>
                <span>מוצר</span>
                <span>כמות</span>
                <span className="text-end">סה״כ שורה</span>
                <span />
              </div>
              {rows.map((r) => {
                const p = bySku.get(r.sku);
                return (
                  <div key={r.id} className={`${cols} items-center py-2`}>
                    <Select value={r.sku} onValueChange={(v) => update(r.id, { sku: v ?? '' })}>
                      <SelectTrigger aria-label="מוצר" className="w-full">
                        <SelectValue placeholder="בחר מוצר">{p ? `${p.name} · ${p.sku}` : undefined}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.sku} value={p.sku}>
                            <span className="font-mono text-xs text-ink-3" dir="ltr">
                              {p.sku}
                            </span>{' '}
                            {p.name} · <Money value={p.price} className="text-ink-2" />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      aria-label="כמות"
                      type="number"
                      min={1}
                      max={MAX_QTY}
                      step={1}
                      inputMode="numeric"
                      className="num"
                      value={r.qty}
                      onChange={(e) => update(r.id, { qty: clampQty(Number(e.target.value)) })}
                    />
                    <div className="text-end num text-sm">{p ? <Money value={round2(p.price * r.qty)} /> : <span className="text-ink-3">—</span>}</div>
                    <Button type="button" variant="ghost" size="icon" aria-label="הסרת שורה" onClick={() => removeRow(r.id)} disabled={rows.length === 1}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <input type="hidden" name="items" value={JSON.stringify(chosen.map((i) => ({ sku: i.sku, qty: i.qty })))} />
            <FieldError msg={state?.errors?.items} />
          </div>

          {field('note', 'הערה', { placeholder: 'אופציונלי, עד 500 תווים' })}

          <dl className="ms-auto w-64 space-y-1.5 text-sm">
            <div className="flex justify-between border-t border-dashed border-rule-strong pt-1.5 font-semibold">
              <dt>סה״כ משוער</dt>
              <dd>
                <Money value={estimate} />
              </dd>
            </div>
            <p className="text-xs text-ink-3">המחיר הסופי, המשלוח והמע״מ נקבעים בשרת מהקטלוג.</p>
          </dl>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <SubmitButton pendingText="יוצר…">יצירה</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
