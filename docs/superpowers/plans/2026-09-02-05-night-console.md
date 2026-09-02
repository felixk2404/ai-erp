# תוכנית 5 — Night Console

**Spec:** `docs/superpowers/specs/2026-09-02-night-console-design.md`

סדר העבודה: תשתית → שלד → דשבורד → מסכים → לוגין/קיצורים → אימות. כל שלב מסתיים ב-build ירוק.

## T1 — טוקנים, פונטים, רקע, פרימיטיבים
- `globals.css`: טוקני Night Console + aliases, `color-scheme: dark`, dot-matrix body, `.panel` (spotlight), `.hud`, `.led-live`, scrollbar, selection, `@utility mono`.
- `layout.tsx`: Heebo + IBM Plex Mono (next/font), `SpotlightProvider`, `Hotkeys`.
- `components/motion/spotlight.tsx`.
- sed: `bg-paper-2 border border-rule rounded-lg` → `panel` בכל הקבצים.
- `ui/button.tsx`: primary = signal על טקסט כהה + glow. `ui/input.tsx`: bg well.
- בדיקה: build + צילום דשבורד.

## T2 — שלד
- `shell/sidebar.tsx` + `nav-link.tsx`: אייקונים, פס אקטיבי `layoutId`, LED n8n (`PulseDot` client).
- `shell/header.tsx`: כותרת Heebo 28/800, tracking.
- `command-menu.tsx`: סגנון + ⌘K-AI (F6).
- `shell/hotkeys.tsx` (F10).

## T3 — דשבורד
- `lib/insights.ts`: `monthDelta`. + test.
- `charts/sparkline.tsx`; `ledger-strip.tsx` → sparkline + delta; `motion/signal-beams.tsx` (F4 + signature).
- `lib/workflows.ts` manifest + test; `lib/n8n-health.ts` `fetchPulse`/`summarizePulse` + test; `app/api/pulse/route.ts`.
- `dashboard/pulse-feed.tsx` (F1), `dashboard/system-map.tsx` (F2), `dashboard/health-strip.tsx` (LED live).
- `motion/stream-text.tsx`, `dashboard/brief-card.tsx` (F3).
- `charts/*` HUD (F7).
- `(app)/page.tsx`: גריד חדש — strip / brief 5 + attention 4 + health 3 / revenue 7 + (status+funnel) 5 / pulse 5 + system-map 7 / recent 7 + top 5.

## T4 — מסכים
- `motion/tilt.tsx`; `product-card.tsx`; `invoices/[id]/page.tsx` (F8).
- `ui/table.tsx`, `empty-state.tsx`, `status-led.tsx`, `timeline.tsx`, `chat-panel.tsx`, `support/page.tsx`, select-ים native (bg well).

## T5 — לוגין
- `motion/aurora.tsx`, `login/page.tsx`, `login-form.tsx` (F9).

## T6 — אימות ותיעוד
- vitest, typecheck, lint, build. `e2e/screens.mjs`. design-review + rtl-qa. `system.md` מעודכן. `tasks/todo.md` review. commit.
