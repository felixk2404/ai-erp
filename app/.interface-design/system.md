# AI-ERP — design system notes

## Direction
"פנקס פוגש מכשיר": invoice-book paper surfaces, anthracite device text, one carbon-copy-blue ink accent for actions, LED dots only for status. Light mode only (single-owner work tool). Density: workbench.

## Tokens (globals.css)
- Surfaces: `--paper` #f7f3ea (canvas) → `--paper-2` #fdfbf6 (card/table) → `--paper-3` #efe9dc (inset: inputs, subheaders).
- Text: `--ink` #1f2326 · `--ink-2` #4b5157 · `--ink-3` #7a8087 (meta/disabled).
- Rules: `--rule` rgba(31,35,38,.10) · `--rule-strong` .22. Depth strategy: borders-only; one soft 3-layer shadow only on login card.
- Accent: `--inkblue` #2b4c7e (+hover #23406b, soft 10%). Status LEDs: green #2f9e5b · amber #d08a1d · red #c4453a. `--copper` reserved.
- Radius: 8px base (`--radius: .5rem`), sm 4 / lg 12.

## Type
- IBM Plex Sans Hebrew 400/500/600 for UI (`--font-plex`), Frank Ruhl Libre 500/700 for h1/h2 (`--font-frank`).
- Scale (ratio 1.25 from 14): 11 (tracked labels) · 14 body · 18 h2/values · 22 · 28 h1 & hero number.
- Every dynamic number gets `.num` (tabular-nums). Money via `<Money/>`: `1,180.00 ₪`.

## Patterns
- LedgerStrip — one horizontal strip, hero item flex 1.6 (28/600), others flex 1 (18/500), 11px tracked labels, dashed "tear line" below. Mobile: 2-col grid, hero spans 2.
- StatusLed — 8px dot + 6px glow of same color, label from `statusMeta`. `off` = ink-3/40, no glow.
- Sidebar — 232px, same canvas as content, `border-e border-rule`, text nav with counts (11px num, ink-3); active = inkblue-soft bg + inkblue text. Mobile: sticky top bar + horizontal scroll nav.
- Tables — wrapper `bg-paper-2 border border-rule rounded-lg overflow-hidden`; shadcn Table; header 11–14px; rows ~40px; secondary cols `text-ink-2`. Long text cells need `whitespace-normal` (shadcn td is nowrap) and `table-fixed` when clamping.
- Dialogs/Sheets — Base UI (`render={<Button/>}`, no asChild). Close button uses logical `end-*`. Headers `pe-8` so the X never overlaps the title. Chat sheet opens `side="left"` (far side in RTL), 420px, full width < sm.
- Forms — EntityDialog + FormErrorsContext + `<FieldError name/>`; server actions wrapped client-side in useActionState (toast + close there, never in useEffect). Optimistic toggles via useOptimistic.
- Page header — h1 28px Frank Ruhl on the start side, actions + "שאל את המנהל" on the end side.
