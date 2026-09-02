'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpIcon, XIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { splitSentences } from '@/lib/support-text';
import { sendSupport, type SupportProduct } from '@/app/support/actions';
import { ProductChip } from './product-chip';

const SPRING = { type: 'spring' as const, bounce: 0.2, visualDuration: 0.3 };
const TELEGRAM = 'https://t.me/aielec_support_bot';
const SUGGESTIONS = ['מה ההבדל בין TY-200 ל-TY-Gamer H7?', 'מה מדיניות ההחזרות?', 'משלוח חינם?'];

type Msg =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'agent'; text: string; products: SupportProduct[] }
  | { id: number; role: 'error'; text: string; retry: string };

/** ברכה לפי המקום שממנו נפתחה השיחה — הסוכן "יודע" איפה הלקוח עומד. */
function greetingFor(pathname: string): string {
  if (/^\/products\/[^/]+/.test(pathname)) return 'שאלות על המוצר הזה? אני כאן.';
  if (pathname.startsWith('/orders')) return 'שאלה על ההזמנה?';
  return 'שלום! איך אפשר לעזור?';
}

/** תשובת הסוכן נחשפת משפט־משפט (40ms) — נותן תחושת הקלדה בלי streaming אמיתי. */
function AgentText({ text }: { text: string }) {
  const reduce = useReducedMotion();
  const parts = useMemo(() => splitSentences(text), [text]);

  return (
    <AnimatePresence initial>
      {parts.map((part, i) => (
        <motion.span
          key={`${i}-${part}`}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: reduce ? 0 : 0.28, delay: reduce ? 0 : i * 0.04 }}
        >
          {part}{' '}
        </motion.span>
      ))}
    </AnimatePresence>
  );
}

/**
 * Intent: חלון שיחה קטן שנפתח מעל הכפתור הצף — נוכח, לא חוסם את החנות.
 * Hierarchy: הבועה האחרונה היא המוקד; הכותרת והפוטר מודחתים ל-glow-3.
 */
export function SupportPanel({ prefill, onClose }: { prefill: { text: string; at: number } | null; onClose: () => void }) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(prefill?.text ?? '');
  const [seenPrefill, setSeenPrefill] = useState(prefill?.at ?? 0);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const sku = pathname.match(/^\/products\/([^/]+)/)?.[1];

  // prefill שהגיע מאירוע `aie:support` בזמן שהפאנל פתוח — התאמת state בזמן render,
  // הדפוס המומלץ ב-React במקום setState בתוך effect.
  if (prefill && prefill.at !== seenPrefill) {
    setSeenPrefill(prefill.at);
    setInput(prefill.text);
  }

  // מיקוד נכנס לפאנל ברגע שהוא נפתח, ושוב כשמגיעה שאלה מוכנה מבחוץ.
  useEffect(() => {
    inputRef.current?.focus();
  }, [prefill]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, pending]);

  const ask = (raw: string) => {
    const text = raw.trim();
    if (!text || pending) return;
    setInput('');
    setMessages((m) => [...m, { id: (idRef.current += 1), role: 'user', text }]);
    start(async () => {
      const res = await sendSupport(text, { sku, page: pathname });
      setMessages((m) => [
        ...m,
        res.reply
          ? { id: (idRef.current += 1), role: 'agent', text: res.reply, products: res.products ?? [] }
          : { id: (idRef.current += 1), role: 'error', text: res.error ?? 'משהו השתבש.', retry: text },
      ]);
    });
  };

  return (
    <motion.div
      role="dialog"
      aria-label="שירות לקוחות"
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } }}
      transition={SPRING}
      /* RTL: פינת ה-start היא הימנית — הפאנל "יוצא" מהכפתור שמתחתיו. */
      className="fixed z-50 flex origin-[bottom_right] flex-col overflow-hidden border border-rule bg-panel-1 max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[80dvh] max-sm:rounded-t-lg sm:bottom-22 sm:start-5 sm:h-[560px] sm:w-[380px] sm:rounded-lg"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(120%_90%_at_100%_0%,var(--color-beam-soft),transparent_70%)]"
      />

      <header className="relative flex items-center gap-2.5 border-b border-rule px-4 py-3">
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-ok shadow-[0_0_8px_var(--color-ok)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-tight font-medium text-glow">שירות לקוחות</p>
          <p className="text-[11px] leading-tight text-glow-3">בדרך כלל עונה תוך שניות</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירת השיחה"
          className="-me-2 grid size-10 shrink-0 place-items-center rounded-md text-glow-3 transition-colors hover:bg-panel-2 hover:text-glow"
        >
          <XIcon size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </header>

      <div role="log" aria-live="polite" aria-label="שיחה" className="relative flex flex-1 flex-col overflow-y-auto px-4 py-4">
        {/* השיחה נצמדת לתחתית — הבועה האחרונה תמיד ליד תיבת הכתיבה. */}
        <div className="mt-auto space-y-3">
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-glow-2">{greetingFor(pathname)}</p>
              <div className="flex flex-col items-start gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="min-h-10 rounded-sm border border-rule bg-panel-2 px-3 py-2 text-start text-sm text-glow-2 transition-colors hover:border-rule-strong hover:text-glow"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
                className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {m.role === 'user' && (
                  <p className="max-w-[85%] rounded-md bg-beam px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-void">{m.text}</p>
                )}

                {m.role === 'agent' && (
                  <>
                    <p className="max-w-[90%] rounded-md bg-panel-3 px-3 py-2 text-sm leading-relaxed text-glow">
                      <AgentText text={m.text} />
                    </p>
                    {m.products.length > 0 && (
                      <div className="grid w-full gap-2">
                        {m.products.map((p) => (
                          <ProductChip key={p.sku} product={p} />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {m.role === 'error' && (
                  <div className="max-w-[90%] rounded-md border border-bad/40 bg-panel-2 px-3 py-2 text-sm text-glow-2">
                    <p>{m.text}</p>
                    <button type="button" onClick={() => ask(m.retry)} className="mt-1.5 font-medium text-beam hover:underline">
                      נסה שוב
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {pending && (
            <div className="flex items-start">
              <div className="rounded-md bg-panel-3 px-3 py-2" aria-label="הסוכן מקליד">
                <motion.span
                  aria-hidden
                  className="inline-block h-4 w-[2px] bg-beam align-middle"
                  animate={{ opacity: [1, 0.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form
        className="relative border-t border-rule p-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            rows={1}
            maxLength={500}
            placeholder="כתבו הודעה…"
            aria-label="הודעה"
            className="max-h-24 min-h-10 flex-1 resize-none rounded-sm border-rule bg-panel-2 py-2 text-sm md:text-sm"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            aria-label="שליחה"
            className="grid size-10 shrink-0 place-items-center rounded-sm bg-beam text-void transition-opacity hover:opacity-90 disabled:opacity-35"
          >
            <ArrowUpIcon size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>

        {input.length > 400 && <p className="num mt-1.5 text-end text-[11px] text-glow-3">{input.length}/500</p>}

        <a
          href={TELEGRAM}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-[11px] text-glow-3 transition-colors hover:text-glow-2"
        >
          לשיחה בטלגרם:{' '}
          <span dir="ltr" className="num">
            @aielec_support_bot
          </span>
        </a>
      </form>
    </motion.div>
  );
}
