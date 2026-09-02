# AI-ERP — "חדר בקרה" (Night Console): מסמך עיצוב

תאריך: 2026-09-02
סטטוס: כיוון A אושר על ידי הסטודנט ("תבחרי את כולם, ברמה הכי גבוהה"). מסמך זה מקבע את ההחלטות.
קודם: `2026-09-02-ai-erp-design.md` (מוצר), `app/.interface-design/system.md` (עולם "פנקס נייר" — מוחלף).

## 1. מטרה

להחליף את השכבה הוויזואלית של האפליקציה מעולם "פנקס נייר חם" לעולם "חדר בקרה בלילה": כהה, טכנולוגי, מדויק, עם תחושה שהמערכת חיה ועובדת בשביל בעל העסק. בלי לשנות ארכיטקטורה, נתונים או תהליכי n8n. בנוסף: עשרה פיצ'רים שמוסיפים "חיים" אמיתיים (נתונים חיים, לא קישוט).

## 2. עולם המוצר

**מי:** בעל חנות אלקטרוניקה, פותח את המערכת בבוקר או בערב, רוצה לראות בשנייה מה נכנס, מה תקוע, ומה הסוכנים עשו בלעדיו.
**תחושה:** חדר בקרה קטן בלילה — זכוכית OLED שחורה, שלדת גרפיט, קו אות אחד בציאן, לוח נוריות סטטוס, קריאות dot-matrix. שקט, לא "סייברפאנק צעקני".

**Domain:** אוסילוסקופ, לוח LED, שלדת מכשיר מט, מסך OLED, מסלולי PCB, קרן אות, קריאת מד (readout), פלט טרמינל, מגש בדיקה.
**Color world:** שחור OLED, גרפיט, ציאן של תצוגת סטטוס, ירוק/ענבר/אדום של נוריות, נחושת של מסלול PCB, לבן-קר של טקסט readout.
**Signature:** קו האות (Signal trace) — קרן ציאן דקה שנעה לאורך קווי ההפרדה של רצועת ה-KPI, ופינה חתוכה (HUD) בפאנלי הגרפים.
**Rejecting:** גרדיאנטים סגול-ורוד → גוון יחיד ציאן; כרטיסים זכוכיתיים בכל מקום → זכוכית רק בלוגין; אייקונים צבעוניים → אייקוני קו monochrome; פונט Inter → Heebo לכותרות + Plex Mono למספרים.

## 3. טוקנים (globals.css)

```
--void        #0d1017   canvas
--chassis     #161a23   card
--chassis-2   #1e2330   hover / inset / subheader
--chassis-3   #252b3a   popover / dropdown
--well        #0f1219   inputs (כהה יותר מהסביבה — "מקבל תוכן")
--readout     #f3f5f9   text
--readout-2   #bcc4d1   supporting
--readout-3   #94a0b2   meta (≈ 6:1 על chassis; תוויות מטא 12px)
--rule        rgba(255,255,255,.10)   --rule-strong rgba(255,255,255,.20)
(הערכים הוארו ב-2026-09-02 אחרי משוב הסטודנט: "חשוך מדי, לא רואים את הכתוב")
--signal      #5ad1ff   accent יחיד   --signal-hover #8ee0ff
--signal-soft rgba(90,209,255,.12)    --signal-glow rgba(90,209,255,.45)
--led-green   #34d17a   --led-amber #f0b429   --led-red #ff5a5f
--copper      #d99a5b   שמור (סדרה משנית אם אי פעם יידרש)
```

Aliases כדי שקוד קיים ימשיך לעבוד בלי diff: `--paper→--void`, `--paper-2→--chassis`, `--paper-3→--chassis-2`, `--ink→--readout`, `--ink-2/3`, `--inkblue→--signal` (+hover/soft). קוד חדש משתמש בשמות החדשים. `color-scheme: dark`.

**עומק:** borders-only (rgba לבן) + זוהר ציאן רק ל-focus/active/primary. בלי צללים אפורים (לא נקראים על כהה).
**רדיוס:** 8 בסיס, 4 קטן, 12 כרטיס גדול/דיאלוג. Concentric: outer = inner + padding.
**צפיפות:** workbench — body 14px, כרטיס p-5, רשת 8px.

## 4. טיפוגרפיה

- Heebo 500/700/800 — h1/h2/מספר גיבור. tracking -0.02em מעל 22px.
- IBM Plex Sans Hebrew 400/500/600 — UI.
- IBM Plex Mono 400/500 — `.num`, `.mono` (מספרים, מק"ט, זמנים, קיצורי מקלדת).
- סקאלה 1.25 מ-14: 12 (labels, tracked; 10 mono ל-kickers לטיניים) · 14 · 18 · 20 (ערכי רצועה) · 28 · 30 (hero).

## 5. שכבת הרקע והחתימה

- **Dot-matrix canvas:** body עם `radial-gradient` נקודות 1px כל 24px ב-rgba(255,255,255,.045), ומעליו "אמביינט" ציאן 6% בפינת top-start (radial 600px).
- **Signal trace:** `SignalBeams` — canvas שמצייר קרן ציאן רכה שנעה לאורך קווי ההפרדה (אנכיים) של רצועת ה-KPI. פורט מצומצם של GridBeam (cult-ui): גוון יחיד, breathe, מכבד `prefers-reduced-motion` (סטטי).
- **HUD frame:** מחלקת `.hud` לפאנלי גרפים — `clip-path` פינה חתוכה 14px ב-bottom-end, סוגריים דקים ב-top-start (::before), רקע dot-matrix דחוס יותר.
- **Spotlight:** `.panel` עם ::before של `radial-gradient(240px at var(--mx) var(--my), var(--signal-soft), transparent)` על הגבול (mask border-box/padding-box). מאזין `pointermove` אחד ב-document (`SpotlightProvider`) מעדכן `--mx/--my` על ה-`.panel` שתחת הסמן. בלי JS לכל כרטיס.
- **LED pulse:** `.led-live::after` טבעת שמתרחבת ודוהה (1.6s) — רק לסטטוסים חיים (בריאות, פיד).

## 6. עשרת הפיצ'רים

| # | פיצ'ר | קבצים | נתונים |
|---|---|---|---|
| 1 | **Live Pulse** — פיד הרצות n8n, polling 10s, שורות חדשות נכנסות באנימציה, LED לפי סטטוס, "לפני X" | `lib/n8n-health.ts` (`fetchPulse`), `app/api/pulse/route.ts`, `components/dashboard/pulse-feed.tsx` | n8n Public API `/executions`, `/workflows` |
| 2 | **מפת מערכת** — 13 workflows כצמתים ב-SVG סביב hub (API), LED לכל צומת, ריצה אחרונה, שגיאות 24h | `lib/workflows.ts` (manifest עברי), `components/dashboard/system-map.tsx` | manifest + `fetchPulse` (fallback: manifest בלבד, "לא מחובר") |
| 3 | **סוכן חושב** — במקום skeleton: פאנל "קורא נתונים…" עם scan-line וטיימר; התקציר נחשף מילה-מילה עם cursor | `components/motion/stream-text.tsx`, `dashboard/brief-card.tsx` | קיים (`getDailyBrief`) |
| 4 | **KPI חכם** — sparkline 6 חודשים + דלתא מול חודש קודם בכל פריט ברצועה | `lib/insights.ts` (`monthDelta`), `components/charts/sparkline.tsx`, `components/ledger-strip.tsx` | `revenueByMonth` + ספירות חודשיות |
| 5 | **Spotlight cards** | `components/motion/spotlight.tsx`, CSS `.panel` | — |
| 6 | **⌘K עם AI** — הקלדה ≥ 3 תווים מציגה "שאל את המנהל: …"; Enter שולח ל-`sendChat`; התשובה מוזרמת בתוך הפלטה | `components/command-menu.tsx` | `sendChat` קיים |
| 7 | **HUD charts** — מסגרת חתוכה, dot-matrix, readout חי בפינה בהובר, עמודות ציאן עם gradient | `charts/revenue-bars.tsx`, `charts/funnel.tsx`, `charts/status-bar.tsx`, CSS `.hud` | קיים |
| 8 | **Tilt 3D** — `Tilt` (≤ 6°, perspective 800, spring) על כרטיסי מוצר וכרטיס הסיכום בחשבונית | `components/motion/tilt.tsx`, `product-card.tsx`, `invoices/[id]/page.tsx` | — |
| 9 | **Aurora login** — רקע blobs ציאן/כחול-עמוק מטושטשים בתנועה איטית (CSS, בלי WebGL) + כרטיס זכוכית | `(auth)/login/page.tsx`, `login-form.tsx`, `components/motion/aurora.tsx` | — |
| 10 | **קיצורי מקלדת** — `?` פותח שכבת עזרה; `g` ואז `d/i/l/c/p/t` ניווט; `n` פותח יצירה בעמוד הנוכחי (אם יש) | `components/shell/hotkeys.tsx` | — |

בנוסף: sidebar עם אייקוני lucide, פס אקטיבי קפיצי (motion `layoutId`), LED n8n בתחתית (polling `/api/pulse` 30s); כפתור primary ציאן על טקסט כהה; טבלאות עם header 11px tracked ורקע chassis-2; ProductCard עם מסגרת תמונה inset-ring; empty-state illustrations בתוך עיגול chassis-2 עם `mix-blend-screen`? — לא: התמונות בז' — מציגים אותן כ"מסך" בתוך מסגרת עגולה עם ring, בלי blend.

## 7. Dataviz

גוון יחיד (`--signal`) לכל הסדרות הכמותיות. Funnel = ציאן ב-100/65/40% opacity. סטטוס = פלטת LED עם תווית ומספר ליד כל צבע (זהות לא רק בצבע). מריצים `validate_palette.js --mode dark` על LED palette מול `--chassis`. אין dual-axis, אין קטגוריאלי רב-גוני.

## 8. תנועה

< 300ms, `transform/opacity` בלבד, ease-out `cubic-bezier(.23,1,.32,1)`. Reveal/CountUp/View Transitions נשארים. Beams ו-aurora = רקע, לא UI; מכבדים reduced-motion (נעצרים). Polling לא מפעיל אנימציה על פריטים קיימים — רק על חדשים (AnimatePresence, key=id).

## 9. אבטחה ופרטיות

`/api/pulse` מאחורי ה-proxy (לא ב-PUBLIC). מחזיר רק שמות workflows, סטטוסים וזמנים — לא payloads. ⌘K-AI משתמש ב-`sendChat` הקיים (session cookie). ללא סודות בלקוח.

## 10. בדיקות

- vitest: `monthDelta`, `summarizePulse`, manifest שלם (13 workflows, שמות עבריים ייחודיים).
- `pnpm build`, `pnpm typecheck`, `pnpm lint`.
- Playwright smoke קיים + `e2e/screens.mjs` לצילומים (desktop/mobile) — בדיקה ויזואלית של כל המסכים.
- design-review + rtl-qa על הדשבורד, הלוגין והמוצרים.

## 11. מה לא

לא WebGL/three.js (משקל, מובייל). לא dark/light toggle (החלטה: כהה בלבד). לא שינוי ב-n8n. לא ספריות UI חדשות — motion, recharts, cmdk, Base UI קיימים מספיקים.
