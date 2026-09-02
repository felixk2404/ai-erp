# Company logo — איי.איי אלקטרוניקה (2026-09-02)

Spec: docs/superpowers/specs/2026-09-02-company-logo-design.md

- [x] 1. Concept boards (3 rounds: circuit-trace flat → futuristic flat → 3D folded titanium). Felix picked the 3D folded mark, then asked for ELECTRONICS under it.
- [x] 2. Final renders: Nano Banana Pro mark → Bria background removal; gpt-image-2 edit for the ELECTRONICS lockup (dark + cutout).
- [x] 3. Assets in app/public/brand: logo-mark.png (transparent 1024), logo-lockup.png (transparent), logo-lockup-dark.png, telegram-avatar.png. Old logo.png removed.
- [x] 4. Wired: sidebar (desktop + mobile), login, /support header, favicon (layout.tsx), WF8 invoice PDF header (img from ai-erp-rho.vercel.app/brand/logo-mark.png).
- [ ] 5. WF8 import to n8n — two attempts failed on sqlite lock / "Database is not ready", retrying.
- [ ] 6. Browser check: /support OK (logo in header). Login + dashboard sidebar pending.
- [ ] 7. Commit only logo files (another session is committing concurrently in this repo).
- [ ] 8. Telegram: Felix uploads telegram-avatar.png via BotFather /setuserpic (manual).

## Skipped
- Flat SVG version: PNG cutout reads fine at 16px; add an SVG only if print/vector is ever needed.

## Review
(fill after done)
