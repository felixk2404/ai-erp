# AI-ERP — design system notes (Night Console)

## Direction
"חדר בקרה בלילה": OLED-black glass canvas, graphite chassis surfaces, one electric-cyan signal accent, LED dots for status, mono digits like a meter readout. Dark only (single-owner work tool). Density: workbench. Spec: `docs/superpowers/specs/2026-09-02-night-console-design.md`.
(Previous world "פנקס נייר" retired 2026-09-02; old token names remain as aliases.)

## Tokens (globals.css)
- Surfaces: `--void` #0d1017 (canvas) → `--chassis` #161a23 (card) → `--chassis-2` #1e2330 (hover/inset/subheader) → `--chassis-3` #252b3a (popover). `--well` #0f1219 for inputs (inset = darker). (Lifted 2026-09-02 after owner feedback "too dark".)
- Text: `--readout` #f3f5f9 · `--readout-2` #bcc4d1 · `--readout-3` #94a0b2 (meta, ≈6:1 on chassis). Meta labels are 12px (not 11) on dark.
- Rules: `--rule` rgba(255,255,255,.10) · `--rule-strong` .20. Depth: borders-only + cyan glow for focus/active/primary. No grey shadows.
- Accent: `--signal` #5ad1ff (+hover #8ee0ff, soft 12%, glow 45%, `--signal-rgb` 90 209 255). LEDs: green #34d17a · amber #f0b429 · red #ff5a5f. `--copper` reserved.
- Aliases: paper→void, paper-2→chassis, paper-3→chassis-2, ink→readout, inkblue→signal. New code uses new names.
- Radius: 8 base, 4 small, 12 dialogs. `html.dark` set so shadcn dark variants apply.

## Type
- Heebo 500/700/800 (`--font-heebo`) for h1/h2 + hero, tracking -0.02em. IBM Plex Sans Hebrew 400/500/600 UI. IBM Plex Mono 400/500 for `.num` / `.mono` (digits, SKU, timestamps, kbd).
- Scale 1.25 from 14: 10–11 tracked mono labels (`tracking-[0.18em]` for Latin kickers) · 14 body · 18 h2 · 20 strip values · 28 h1 · 30 hero.

## Signature layers (globals.css)
- Body `::before` fixed: dot-matrix (1px / 24px, .055) + cyan ambient radial at top-start (9%).
- `.panel` — chassis surface whose border is painted: radial cyan at `--mx/--my` (set by `SpotlightProvider`, one document pointermove) fades via `@property --spot`. Works with overflow-hidden.
- `.hud` — chart panels: clip-path corner cut 14px bottom-left, bracket tick top-right, `.hud-grid` dense dots behind plots.
- `.led-live` — expanding ring (1.8s) for live states only. `.scanline`, `.shimmer`, `.cursor-blink`, `.glow-text` for agent/loading moments. All stop under reduced-motion.
- `SignalBeams` — canvas cyan beams along strip dividers (single hue, breathe, RTL horizontal drift).

## Patterns
- LedgerStrip — `panel` + beams; hero flex 1.7 (30/500 mono + glow, sparkline 110×32, delta chip ▲/▼ mono), others flex 1 (20/500). Mobile 2×2, hero spans 2, sparkline hidden < sm.
- Sidebar — 236px, same canvas, `border-e border-rule`; NavLink = lucide icon (name string prop) + label + count; active = `layoutId` pill `bg-signal-soft` + inset 2px cyan bar (spring 520/42). `PulseDot` n8n LED at bottom (polls `/api/pulse` 30s). Brand: logo ring-1 white/10 + cyan blur halo, kicker `AI-ERP · CONSOLE`.
- Header — kicker mono 10px tracked (optional) + h1 Heebo 28/800.
- Buttons — primary `bg-signal text-#06121a font-semibold` + 1px cyan ring + soft glow, `active:scale-[.98]`; outline = chassis + rule-strong, hover border signal/40.
- Inputs — `bg-well`, focus border signal + ring signal/25. Native selects/textarea also `bg-well`.
- Tables — wrapper `panel overflow-hidden`; header 11px tracked readout-3 on `chassis-2/60`; rows hover `signal-soft/40`.
- StatusLed — 8px dot + 8px glow; off = readout-3/50. Timeline current dot is `led-live`.
- Dashboard grid (12 cols) — strip / brief 5 + attention 4 + health 3 / revenue(hud) 7 + status+funnel 5 / pulse 5 + system-map(hud) 7 / recent 7 + top 5. Cards p-5, sub-label 11px + h2 18/700.
- BriefCard — StreamText word-by-word (34ms) with cyan cursor, left cyan gradient rule; skeleton = ThinkingPanel (steps + scanline + mm:ss).
- PulseFeed — AnimatePresence popLayout, key=id, enter spring bounce .15 / .3s, exit 120ms. Base time from server payload (no hydration drift).
- SystemMap — SVG 440×300, hub r30 center, 12 nodes on ellipse rx172/ry112; `.packet` dash animation on traces for nodes with runs; labels: right-side nodes `text-anchor=end`, left `start` (RTL SVG). Legend list below (identity never color-alone).
- Charts (dataviz) — single hue signal: bars gradient signal→35%, current month opacity 1 + glow, others .5; readout line top-start on hover (label · ₪ · count). Status bar = LED palette with 2px gaps + legend counts. Funnel = signal 100/65/40%.
- ProductCard — `Tilt` (≤5°, spring, cyan glare) around `panel`; image on chassis-2 with inset ring white/10 + bottom fade; SKU chip mono cyan on void/70.
- CommandMenu — dialog on chassis with cyan ring; query ≥3 chars adds "שאל את המנהל" item (Sparkles); Enter with no selection asks; answer view = question bubble + StreamText reply. Trigger button `bg-well` with Sparkles.
- Hotkeys — `?` help dialog, `g`+`d/i/l/c/p/t` navigate, `n` clicks `[data-hotkey="new"]` (EntityDialog + NewInvoiceDialog triggers). Inactive while typing or a dialog is open.
- Login — `Aurora` (3 CSS blobs, 22–28s drift, blur 100–120px) + glass card `bg-chassis/55 backdrop-blur-2xl` + cyan halo; password input mono tracked; footer kicker mono.
- Empty states — illustration inside 160px circle `ring-1 white/10 bg-chassis-2` with soft cyan shadow (no multiply blend on dark).
- Motion — Reveal 8px/320ms/50ms stagger; CountUp 600ms; View Transitions unchanged; `MotionConfig reducedMotion="user"`. Everything < 300ms per element, transform/opacity only; beams/aurora are background and stop under reduced-motion.
