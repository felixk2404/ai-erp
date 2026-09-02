'use client';

import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import { createInvoice, type FormState } from './actions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubmitButton } from '@/components/forms/submit-button';
import { FieldError } from '@/components/forms/field-error';

export type CustomerOption = { id: string; label: string };

export function NewInvoiceDialog({ customers }: { customers: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await createInvoice(prev, fd);
    if (result?.ok) {
      toast.success('החשבונית נוצרה. המע״מ והמספר הרץ יחושבו תוך דקה.');
      setOpen(false);
    } else if (result?.error) {
      toast.error(result.error);
    }
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>חשבונית חדשה</DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader className="text-start">
          <DialogTitle>חשבונית חדשה</DialogTitle>
          <DialogDescription>המע״מ (18%) והמספר הרץ מחושבים אוטומטית על ידי n8n.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="CustomerId">לקוח</Label>
            <Select name="CustomerId">
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
            <Label htmlFor="Amount">סכום לפני מע״מ (₪)</Label>
            <Input id="Amount" name="Amount" type="number" step="0.01" min="0.01" inputMode="decimal" className="num" required />
            <FieldError msg={state?.errors?.Amount} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
