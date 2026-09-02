'use client';

import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '@/lib/utils';
import { errorId, useFormErrors } from '@/components/forms/form-errors';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  // שדה בתוך EntityDialog מתחבר לבד להודעת השגיאה שלו — אחרת <p role="alert"> מרחף בלי קשר לשדה (3.3.1)
  const errors = useFormErrors();
  const invalid = props.name ? errors[props.name] : undefined;
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      aria-invalid={invalid ? true : undefined}
      aria-describedby={invalid ? errorId(props.name!) : undefined}
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-well px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-signal focus-visible:ring-3 focus-visible:ring-signal/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm  dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
