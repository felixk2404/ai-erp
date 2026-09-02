'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

/**
 * `disabled` היה מוציא את הכפתור מסדר ה-tab ומאבד את המיקוד ל-<body> לכל אורך
 * הנסיעה ל-n8n/Airtable. `aria-disabled` + שומר על ה-click משאיר את המיקוד במקום (2.4.3),
 * והאזור החי מודיע שמשהו קורה (4.1.3).
 */
export function SubmitButton({ children, pendingText = 'שומר…' }: { children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" aria-disabled={pending} className="aria-disabled:opacity-60" onClick={(e) => pending && e.preventDefault()}>
        {pending ? pendingText : children}
      </Button>
      <span aria-live="polite" className="sr-only">
        {pending ? pendingText : ''}
      </span>
    </>
  );
}
