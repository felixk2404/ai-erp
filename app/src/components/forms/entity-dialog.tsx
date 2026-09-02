'use client';

import { createContext, useActionState, useContext, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubmitButton } from './submit-button';

export type FormState = { ok?: boolean; error?: string; errors?: Record<string, string> } | undefined;

/** שגיאות שדה של הטופס הנוכחי — <FieldError name="X"/> קורא מכאן. */
export const FormErrorsContext = createContext<Record<string, string>>({});
export const useFormErrors = () => useContext(FormErrorsContext);

type Props = {
  trigger: string;
  title: string;
  description?: string;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  successMessage: string;
  submitLabel?: string;
  children: React.ReactNode;
};

/** דיאלוג יצירה גנרי: טופס → server action → toast + סגירה. שגיאות שדה מוצגות דרך FormErrorsContext. */
export function EntityDialog({ trigger, title, description, action, successMessage, submitLabel = 'שמירה', children }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await action(prev, fd);
    if (result?.ok) {
      toast.success(successMessage);
      setOpen(false);
    } else if (result?.error) {
      toast.error(result.error);
    }
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button data-hotkey="new" />}>{trigger}</DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader className="text-start pe-8">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <FormErrorsContext.Provider value={state?.errors ?? {}}>{children}</FormErrorsContext.Provider>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
