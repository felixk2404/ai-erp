'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const next = useSearchParams().get('next') ?? '/';

  return (
    <form
      action={action}
      className="w-full max-w-sm bg-paper-2 border border-rule rounded-lg p-8 shadow-[0_0_0_1px_rgba(31,35,38,.04),0_1px_2px_-1px_rgba(31,35,38,.06),0_2px_4px_rgba(31,35,38,.04)]"
    >
      <div className="text-[11px] font-medium tracking-wide text-ink-3">AI-ERP</div>
      <h1 className="text-[28px] leading-tight font-bold mt-1">איי.איי אלקטרוניקה</h1>
      <p className="text-ink-2 mt-1">כניסה למערכת הניהול</p>
      <input type="hidden" name="next" value={next} />
      <div className="mt-6 space-y-2">
        <Label htmlFor="password">סיסמה</Label>
        <Input id="password" name="password" type="password" autoFocus required autoComplete="current-password" />
        {state?.error && (
          <p role="alert" className="text-led-red text-sm">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" className="mt-6 w-full" disabled={pending}>
        {pending ? 'בודק…' : 'כניסה'}
      </Button>
    </form>
  );
}
