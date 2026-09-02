# AI-ERP — משימות

## Company logo — איי.איי אלקטרוניקה (2026-09-02)

Spec: docs/superpowers/specs/2026-09-02-company-logo-design.md

- [x] 1. Concept boards (3 rounds: circuit-trace flat → futuristic flat → 3D folded titanium). Felix picked the 3D folded mark, then asked for ELECTRONICS under it.
- [x] 2. Final renders: Nano Banana Pro mark → Bria background removal; gpt-image-2 edit for the ELECTRONICS lockup (dark + cutout).
- [x] 3. Assets in app/public/brand: logo-mark.png (transparent 1024), logo-lockup.png (transparent), logo-lockup-dark.png, telegram-avatar.png. Old logo.png removed.
- [x] 4. Wired: sidebar (desktop + mobile), login, /support header, favicon (layout.tsx), WF8 invoice PDF header (img from ai-erp-rho.vercel.app/brand/logo-mark.png).
- [x] 5. WF8 imported to n8n (id wNxCRwm0N2F6Z8TS, active). Needed a container restart: sqlite mutex deadlock, recovery took ~5 min.
- [x] 6. Browser check passed: login, dashboard sidebar, /support locally; /support on production after deploy.
- [x] 7. Logo files went out inside the night-console session's commit 260f0be; WF8 header committed separately as c5d132c. Live on production.
- [ ] 8. Telegram: Felix uploads telegram-avatar.png via BotFather /setuserpic (manual).

## Skipped
- Flat SVG version: PNG cutout reads fine at 16px; add an SVG only if print/vector is ever needed.

## Review
לוגו החברה הוחלף בכל המערכת. הישן (ספר חשבוניות שטוח) הוחלף בסמל AI תלת-ממדי: סרט טיטניום מקופל, להב I, כדור כחול בקודקוד, וכיתוב ELECTRONICS מתחת. שלושה סבבי קונספט עד שהכיוון התכנס (שטוח מעגל מודפס, שטוח עתידני, ואז תלת-ממד). ההפקה: Nano Banana Pro לסמל, gpt-image-2/edit לכיתוב, Bria להסרת רקע.
מה שנשאר ידני: אווטאר הבוטים בטלגרם דרך BotFather /setuserpic.

## תוכנית 5 — Night Console (סשן העיצוב, 2026-09-02) — הושלם ונפרס
- [x] T1–T6: docs/superpowers/plans/2026-09-02-05-night-console.md · commits 260f0be, f2b02c5.
- ירוק: build, typecheck, lint, vitest 50/50. e2e מול פרודקשן https://ai-erp-rho.vercel.app: **9/9**. מקומית "support page" נופל רק כש-n8n מחזיר 503.
- נפרס 17:25 (ai-frl1ioxtq, target production). env `N8N_API_URL/KEY` סונכרנו ל-Vercel (production + preview) — פיד חי ומפת מערכת ONLINE בפרודקשן.
- באג שנתפס באימות ותוקן: `startedAt:null` מ-n8n הפיל את הדשבורד (`n8n-health.ts` + בדיקה).
- rtl-qa: header wrap בנייד, ניווט נייד scrollIntoView+fade, עמודות משניות מוסתרות בנייד, יעדי לחיצה 44px במגע, גרש בחודשים, "פריט אחד".
- משוב "חשוך מדי": משטחים/טקסט/קווים הוארו, תוויות מטא 12px.
- ידוע/לא שלנו: אזהרת hydration `caret-color` בשדה סיסמה בלוגין (Base UI, dev בלבד, קיימת מלפני).

## תוכנית 5 — בקאנד הזמנות (2026-09-02)
- [x] טבלת Orders + שדות Stock/Highlights ב-Products
- [x] seed-stock
- [x] WF10 — הזמנה מהחנות
- [x] WF13 action:"order" + action:"order_status"
- [x] כלי check_stock לסוכן
- [x] הזמנות בעמוד המנהל
- [x] תיקון לולאה ב-WF1 (Loop Over Items)
- [x] גל תיקונים אחרי סקירה סופית (2026-09-02): כשל התראה לא מפיל הזמנה, תשובת שגיאה ל-`Place Order`, סה"כ החשבונית מגיע מההזמנה (בלי סטיית אגורה), `order_status` לא רגיש לאותיות, חוזה WF13 בראנבוק §7.1
- [ ] לשנות שם ללקוח CUST-0002 ("בדיקה חנות") לשם דמו אמיתי לפני ההגשה
- [ ] STORE_DOMAIN ב-config.json → הכתובת האמיתית של החנות אחרי הפריסה (ואז import מחדש של WF10)
