'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-md mx-auto mt-24 panel p-8 ring-1 ring-led-red/30">
      <h1 className="text-[22px] font-bold">משהו השתבש</h1>
      <p className="text-ink-2 mt-2 text-sm break-words">{error.message}</p>
      <p className="text-ink-3 mt-1 text-xs">אם n8n או Airtable לא זמינים, בדוק שה-Docker והטאנל רצים.</p>
      <Button onClick={reset} className="mt-6">
        נסה שוב
      </Button>
    </div>
  );
}
