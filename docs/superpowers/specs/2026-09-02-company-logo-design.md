# Company logo — איי.איי אלקטרוניקה (AI Electronics)

Date: 2026-09-02. Approved by Felix in chat.

## What
One company logo used everywhere: ERP app (sidebar, login, favicon), public /support page + widget, invoice PDF (WF8), and a derived avatar for the Telegram bots. Replaces `app/public/brand/logo.png` (the open-ledger mark, which was an ERP-only mark).

## Decisions
- Type: symbol + wordmark. Symbol must work alone at 16px.
- Direction: **AI monogram as a printed-circuit trace** — letters A and I built from uniform-weight traces, 45° corners, one junction dot. Family continuity with the existing ledger mark (trace + dot).
- Character: sharp, technical, premium-but-accessible. Not playful, not neon.
- Palette: existing system — ink-blue `#2b4c7e` on paper `#f7f3ea`; one-color mark; inverse (paper on ink `#1f2326`) must work.
- Wordmark: Hebrew primary "איי.איי אלקטרוניקה" (IBM Plex Sans Hebrew 600), English secondary "AI ELECTRONICS" tracked small caps.
- Bot avatar: same symbol inside a chat-bubble/circle, derived, not a new mark.

## Deliverables
- `app/public/brand/logo.svg` (symbol), `logo-lockup.svg` (horizontal), `logo-stacked.svg`, `logo-mono-dark.svg`, `bot-avatar.png` 512px.
- Preview artifact: sizes 16/32/128, lockups, inverse, in-context (sidebar, invoice header).
- Wiring: sidebar, login, support page, favicon, WF8 PDF header.

## Process
1. Concept board via image models (fal.ai) for 6–8 variations of direction A.
2. Final mark hand-built as SVG (exact geometry, scalable, recolorable).
3. Review in artifact, pick, wire into app + PDF.
