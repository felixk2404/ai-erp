'use client';

import { ErrorPanel } from '@/components/error-panel';

/** כשל בעמוד עצמו — הסיידבר נשאר, רק התוכן מוחלף. כשל ב-layout נתפס ב-app/error.tsx. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPanel reset={reset} />;
}
