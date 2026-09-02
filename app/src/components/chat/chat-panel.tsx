'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ils } from '@/lib/format';

export type ChatProduct = { id: string; name: string; sku?: string; price?: number; imageUrl?: string; inStock?: boolean };
export type ChatReply = { reply?: string; error?: string; products?: ChatProduct[] };
type Msg = { role: 'user' | 'agent'; text: string; products?: ChatProduct[] };

type Props = {
  sendAction: (message: string) => Promise<ChatReply>;
  suggestions: string[];
  intro: string;
  placeholder?: string;
  agentLabel?: string;
  compact?: boolean;
};

const EASE = [0.23, 1, 0.32, 1] as const;

/** פאנל צ'אט גנרי: משמש את סוכן המנהל (בתוך האפליקציה) ואת סוכן השירות (עמוד ציבורי + וידג'ט). */
export function ChatPanel({ sendAction, suggestions, intro, placeholder = 'כתבו הודעה… (Enter לשליחה)', agentLabel, compact }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, pending]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || pending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    start(async () => {
      const r = await sendAction(q);
      setMessages((m) => [...m, { role: 'agent', text: r.reply ?? `⚠ ${r.error}`, products: r.products }]);
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3" aria-live="polite" aria-label="שיחה">
        {messages.length === 0 && (
          <div className="text-sm text-ink-2 space-y-3 pt-2">
            <p>{intro}</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button key={s} type="button" variant="outline" size="sm" onClick={() => ask(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: EASE }} className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}>
              {m.role === 'agent' && agentLabel && <span className="text-[12px] text-ink-3 mb-1 me-1">{agentLabel}</span>}
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-signal-soft text-readout border border-signal/20' : 'bg-chassis-2 text-readout border border-rule'}`}>{m.text}</div>
              {m.products && m.products.length > 0 && (
                <div className={`mt-2 grid gap-2 w-full max-w-[85%] ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
                  {m.products.map((p) => (
                    <div key={p.id} className="flex sm:flex-col items-center sm:items-stretch gap-2 rounded-lg border border-rule bg-paper-2 p-2">
                      {p.imageUrl && (
                        <div className="relative size-14 sm:size-auto sm:aspect-square shrink-0 rounded-md overflow-hidden bg-paper-3">
                          <Image src={p.imageUrl} alt={p.name} fill sizes="160px" className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium leading-snug line-clamp-2">{p.name}</div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          {p.price !== undefined && <span className="num text-xs text-ink">{ils(p.price)}</span>}
                          <span className={`text-[12px] ${p.inStock ? 'text-led-green' : 'text-ink-3'}`}>{p.inStock ? 'במלאי' : 'אין במלאי'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {pending && (
          <div className="flex justify-end">
            <div className="bg-chassis-2 border border-rule rounded-lg px-3 py-2 text-sm text-signal" aria-label="חושב">
              <span className="inline-flex gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse [animation-delay:150ms]">●</span>
                <span className="animate-pulse [animation-delay:300ms]">●</span>
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form
        className="flex gap-2 pt-3 border-t border-rule"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={2}
          maxLength={500}
          placeholder={placeholder}
          aria-label="הודעה"
          className="flex-1 resize-none rounded-md border border-input bg-well px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-signal focus-visible:ring-3 focus-visible:ring-signal/25"
        />
        <Button type="submit" disabled={pending || !input.trim()}>
          שלח
        </Button>
      </form>
    </div>
  );
}
