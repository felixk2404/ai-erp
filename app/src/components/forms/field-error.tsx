'use client';

import { errorId, useFormErrors } from './form-errors';

/** הודעת שגיאה לשדה: או `msg` ישיר, או `name` שנקרא מ-FormErrorsContext של EntityDialog. */
export function FieldError({ msg, name }: { msg?: string; name?: string }) {
  const errors = useFormErrors();
  const text = msg ?? (name ? errors[name] : undefined);
  if (!text) return null;
  return (
    <p id={name ? errorId(name) : undefined} role="alert" className="text-sm text-led-red mt-1">
      {text}
    </p>
  );
}
