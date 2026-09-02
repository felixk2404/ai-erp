'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { sendChat } from '@/app/(app)/chat/actions';
import { Button } from '@/components/ui/button';

type Msg = { role: 'user' | 'agent'; text: string };

const SUGGESTIONS = ['מה ההכנסות החודש?', 'כמה חשבוניות לא שולמו?', 'מה מצב הלידים?'];

export function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, pending]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || pending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    start(async () => {
      const r = await sendChat(q);
      setMessages((m) => [...m, { role: 'agent', text: r.reply ?? `⚠ ${r.error}` }]);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3" aria-live="polite" aria-label="שיחה">
        {messages.length === 0 && (
          <div className="text-sm text-ink-2 space-y-3 pt-2">
            <p>סוכן המנהל רואה את סיכום החשבוניות, הלידים והמשימות, ועונה בעברית. נסה:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} type="button" variant="outline" size="sm" onClick={() => ask(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === 'user' ? 'bg-inkblue-soft text-ink' : 'bg-paper-3 text-ink'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-end">
            <div className="bg-paper-3 rounded-lg px-3 py-2 text-sm text-ink-3" aria-label="הסוכן חושב">
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
          placeholder="שאל את סוכן המנהל… (Enter לשליחה)"
          aria-label="הודעה לסוכן"
          className="flex-1 resize-none rounded-md border border-input bg-paper-3 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" disabled={pending || !input.trim()}>
          שלח
        </Button>
      </form>
    </div>
  );
}
