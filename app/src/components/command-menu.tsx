'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Sparkles, CornerDownLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { StreamText } from '@/components/motion/stream-text';
import { sendChat } from '@/app/(app)/chat/actions';

export type CommandItem = { label: string; hint?: string; href: string; group: 'עמודים' | 'לקוחות' | 'חשבוניות' | 'מוצרים' };

const PAGES: CommandItem[] = [
  { label: 'דשבורד', href: '/', group: 'עמודים' },
  { label: 'חשבוניות', href: '/invoices', group: 'עמודים' },
  { label: 'לידים', href: '/leads', group: 'עמודים' },
  { label: 'לקוחות', href: '/customers', group: 'עמודים' },
  { label: 'מוצרים', href: '/products', group: 'עמודים' },
  { label: 'משימות', href: '/tasks', group: 'עמודים' },
  { label: 'שירות לקוחות (עמוד ציבורי)', href: '/support', group: 'עמודים' },
];

export const OPEN_EVENT = 'erp:command-menu';

type Answer = { q: string; reply?: string; error?: string };

/**
 * ⌘K / Ctrl+K — ניווט, חיפוש, ושאלה לסוכן המנהל: כל טקסט ≥ 3 תווים מציע "שאל את המנהל",
 * Enter שולח ל-sendChat והתשובה מוזרמת בתוך הפלטה. Backspace/Esc חוזרים לחיפוש.
 */
export function CommandMenu({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href, { transitionTypes: ['nav-forward'] });
  };

  const ask = (text: string) => {
    const question = text.trim();
    if (!question) return;
    setAnswer({ q: question });
    start(async () => {
      const r = await sendChat(question);
      setAnswer({ q: question, reply: r.reply, error: r.error });
    });
  };

  const back = () => {
    setAnswer(null);
    setQ('');
  };

  const groups = ['עמודים', 'לקוחות', 'חשבוניות', 'מוצרים'] as const;
  const all = [...PAGES, ...items];
  const canAsk = q.trim().length >= 3;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) back();
      }}
    >
      <DialogContent dir="rtl" showCloseButton={false} className="p-0 overflow-hidden max-w-lg top-[18%] translate-y-0 bg-chassis ring-1 ring-signal/20 shadow-[0_0_0_1px_rgba(90,209,255,.08),0_30px_60px_-30px_rgba(0,0,0,.9),0_0_80px_-30px_var(--signal-glow)]">
        <DialogTitle className="sr-only">חיפוש</DialogTitle>
        {answer ? (
          <div className="p-4">
            <div className="flex items-center gap-2 text-[11px] text-readout-3">
              <Sparkles className="size-3.5 text-signal" aria-hidden />
              <span>סוכן המנהל</span>
              <button type="button" onClick={back} className="ms-auto text-readout-3 hover:text-readout">
                ← חזרה לחיפוש
              </button>
            </div>
            <div className="mt-3 rounded-md bg-signal-soft text-readout px-3 py-2 text-sm">{answer.q}</div>
            <div className="mt-3 min-h-[72px] text-sm leading-relaxed text-readout">
              {pending || (!answer.reply && !answer.error) ? (
                <span className="shimmer text-sm">הסוכן קורא את הנתונים…</span>
              ) : answer.error ? (
                <span className="text-led-red">{answer.error}</span>
              ) : (
                <StreamText text={answer.reply!} wordMs={26} />
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-readout-3 border-t border-rule pt-2">
              <span>Esc סגירה</span>
              <kbd className="mono">⌘K</kbd>
            </div>
          </div>
        ) : (
          <Command
            label="חיפוש"
            loop
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAsk && !document.querySelector('[cmdk-item][data-selected="true"]')) {
                e.preventDefault();
                ask(q);
              }
            }}
          >
            <div className="flex items-center gap-2 px-4 border-b border-rule">
              <span aria-hidden className={`size-1.5 rounded-full ${canAsk ? 'bg-signal led-live' : 'bg-readout-3/50'}`} />
              <Command.Input value={q} onValueChange={setQ} placeholder="חפש עמוד, לקוח, חשבונית או מוצר — או שאל את המנהל…" className="w-full h-12 bg-transparent outline-none text-sm placeholder:text-readout-3" autoFocus />
            </div>
            <Command.List className="max-h-[380px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-readout-3">{canAsk ? 'אין תוצאה בחיפוש — Enter ישאל את הסוכן' : 'לא נמצא כלום'}</Command.Empty>
              {canAsk && (
                <Command.Group heading="סוכן AI" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:mono [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-readout-3">
                  <Command.Item value={`ask ${q}`} onSelect={() => ask(q)} className="flex items-center gap-3 rounded-md px-2 h-10 text-sm cursor-pointer data-[selected=true]:bg-signal-soft data-[selected=true]:text-signal">
                    <Sparkles className="size-4 text-signal shrink-0" aria-hidden />
                    <span className="truncate">
                      שאל את המנהל: <span className="text-readout">«{q.trim()}»</span>
                    </span>
                    <CornerDownLeft className="size-3.5 text-readout-3 ms-auto shrink-0" aria-hidden />
                  </Command.Item>
                </Command.Group>
              )}
              {groups.map((g) => {
                const rows = all.filter((i) => i.group === g);
                if (rows.length === 0) return null;
                return (
                  <Command.Group key={g} heading={g} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:mono [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-readout-3">
                    {rows.map((i) => (
                      <Command.Item
                        key={i.href + i.label}
                        value={`${i.label} ${i.hint ?? ''}`}
                        onSelect={() => go(i.href)}
                        className="flex items-center justify-between gap-3 rounded-md px-2 h-9 text-sm cursor-pointer data-[selected=true]:bg-signal-soft data-[selected=true]:text-signal"
                      >
                        <span className="truncate">{i.label}</span>
                        {i.hint && (
                          <span className="text-xs text-readout-3 num shrink-0" dir="ltr">
                            {i.hint}
                          </span>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>
            <div className="flex items-center justify-between px-3 h-9 border-t border-rule text-[11px] text-readout-3">
              <span>↑↓ ניווט · Enter בחירה · Esc סגירה · ? קיצורים</span>
              <kbd className="mono">⌘K</kbd>
            </div>
          </Command>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CommandMenuTrigger({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={`flex items-center justify-between rounded-md border border-rule bg-well px-3 h-9 text-sm text-readout-2 hover:text-readout hover:border-signal/40 transition-colors ${className}`}
    >
      <span className="inline-flex items-center gap-2">
        <Sparkles className="size-3.5 text-signal" aria-hidden />
        חיפוש / שאלה…
      </span>
      <kbd className="mono text-[11px] text-readout-3">⌘K</kbd>
    </button>
  );
}
