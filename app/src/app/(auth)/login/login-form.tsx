'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { login } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** כרטיס זכוכית על ה-aurora: מותג עם זוהר, שדה סיסמה בבאר כהה, כפתור ציאן. */
export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const next = useSearchParams().get('next') ?? '/';

  return (
    <form
      action={action}
      className="relative w-full max-w-sm rounded-xl border border-white/10 bg-chassis/55 backdrop-blur-2xl p-8 shadow-[0_0_0_1px_rgba(90,209,255,.10),0_40px_80px_-40px_rgba(0,0,0,.9),0_0_120px_-40px_var(--signal-glow)]"
    >
      <div className="flex items-center gap-3">
        <span className="relative">
          <Image src="/brand/logo-mark.png" alt="" width={56} height={56} priority />
          <span aria-hidden className="absolute -inset-1.5 rounded-xl bg-signal/25 blur-lg -z-10" />
        </span>
        <div>
          <div className="mono text-[10px] tracking-[0.2em] text-signal/80">AI-ERP · CONSOLE</div>
          <h1 className="font-heading text-[24px] leading-tight font-extrabold">איי.איי אלקטרוניקה</h1>
        </div>
      </div>
      <p className="text-readout-2 mt-4 text-sm">כניסה לחדר הבקרה. סוכני ה-AI כבר עובדים — כאן רואים מה הם עשו.</p>
      <input type="hidden" name="next" value={next} />
      <div className="mt-6 space-y-2">
        <Label htmlFor="password">סיסמה</Label>
        <Input id="password" name="password" type="password" autoFocus required autoComplete="current-password" className="h-10 text-base mono tracking-[0.2em]" />
        {state?.error && (
          <p role="alert" className="text-led-red text-sm">
            {state.error}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="mt-6 w-full h-10" disabled={pending}>
        {pending ? 'מאמת…' : 'כניסה'}
      </Button>
      <div className="mt-5 flex items-center justify-center gap-2 text-[12px] text-readout-3">
        <span aria-hidden className="size-1.5 rounded-full bg-led-green led-live" />
        <bdi>13 תהליכי n8n</bdi> · <bdi>3 סוכני AI</bdi> · <bdi>RAG פעיל</bdi>
      </div>
    </form>
  );
}
