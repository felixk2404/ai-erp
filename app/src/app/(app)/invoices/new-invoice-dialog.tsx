'use client';

import { useActionState, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createInvoice, type FormState } from './actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmitButton } from '@/components/forms/submit-button';
import { FieldError } from '@/components/forms/field-error';
import { Money } from '@/components/money';
import { round2, sumItems, type InvoiceItem } from '@/lib/invoice-items';

export type CustomerOption = { id: string; label: string };
export type { ProductOption } from '@/lib/invoice-items';
import type { ProductOption } from '@/lib/invoice-items';


type Row = { id: number; sku: string; qty: number };
const VAT = 0.18;
const fresh = (): Row[] => [{ id: 1, sku: '', qty: 1 }];

export function NewInvoiceDialog({
  customers,
  products,
  defaultCustomerId,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  defaultCustomerId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>(fresh);
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await createInvoice(prev, fd);
    if (result?.ok) {
      toast.success('החשבונית נוצרה. המע״מ והמספר הרץ יחושבו תוך דקה.');
      setOpen(false);
      setRows(fresh());
    } else if (result?.error) {
      toast.error(result.error);
    }
    return result;
  }, undefined);

  const bySku = new Map(products.map((p) => [p.sku, p]));
  const items: InvoiceItem[] = rows.flatMap((r) => {
    const p = bySku.get(r.sku);
    return p ? [{ sku: p.sku, name: p.name, qty: r.qty, price: p.price }] : [];
  });
  const subtotal = sumItems(items);
  const vat = round2(subtotal * VAT);

  const update = (id: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { id: Date.now(), sku: '', qty: 1 }]);
  const removeRow = (id: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));

  const cols = 'grid grid-cols-[minmax(0,1fr)_72px_110px_36px] gap-2 px-3';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button data-hotkey="new" />}>חשבונית חדשה</DialogTrigger>
      <DialogContent dir="rtl" className="sm:max-w-2xl">
        <DialogHeader className="text-start pe-8">
          <DialogTitle>חשבונית חדשה</DialogTitle>
          <DialogDescription>בחר מוצרים מהקטלוג. הסכום, המע״מ (18%) והמספר הרץ מחושבים אוטומטית.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="CustomerId">לקוח</Label>
            <Select name="CustomerId" defaultValue={defaultCustomerId}>
              <SelectTrigger id="CustomerId" className="w-full">
                <SelectValue placeholder="בחר לקוח" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError msg={state?.errors?.CustomerId} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>פריטים</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addRow}>
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
                      step={1}
                      inputMode="numeric"
                      className="num"
                      value={r.qty}
                      onChange={(e) => update(r.id, { qty: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                    />
                    <div className="text-end num text-sm">{p ? <Money value={round2(p.price * r.qty)} /> : <span className="text-ink-3">—</span>}</div>
                    <Button type="button" variant="ghost" size="icon" aria-label="הסרת שורה" onClick={() => removeRow(r.id)} disabled={rows.length === 1}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <input type="hidden" name="Items" value={JSON.stringify(items)} />
            <FieldError msg={state?.errors?.Items} />
          </div>

          <dl className="ms-auto w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-2">
              <dt>לפני מע״מ</dt>
              <dd>
                <Money value={subtotal} />
              </dd>
            </div>
            <div className="flex justify-between text-ink-2">
              <dt>מע״מ 18%</dt>
              <dd>
                <Money value={vat} />
              </dd>
            </div>
            <div className="flex justify-between border-t border-dashed border-rule-strong pt-1.5 font-semibold">
              <dt>סה״כ לתשלום</dt>
              <dd>
                <Money value={round2(subtotal + vat)} />
              </dd>
            </div>
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
