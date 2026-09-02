'use client';

import { createContext, useContext } from 'react';

/** שגיאות שדה של הטופס הנוכחי — <Input name="X"/> ו-<FieldError name="X"/> קוראים מכאן. */
export const FormErrorsContext = createContext<Record<string, string>>({});
export const useFormErrors = () => useContext(FormErrorsContext);

/** מזהה יציב להודעת השגיאה, כדי ש-aria-describedby של השדה יצביע עליה. */
export const errorId = (name: string) => `${name}-error`;
