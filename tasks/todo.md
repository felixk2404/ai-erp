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
- [x] STORE_DOMAIN ב-config.json → `ai-electronics-one.vercel.app` + import מחדש של WF10 (תוכנית 6, משימה 14)

## תוכנית 6 — החנות (store/, 2026-09-02) — הושלם ונפרס
- [x] 1–4: שלד Next.js 16 על 3200, טוקנים ותנועה, קטלוג מ-Airtable, מעטפת (header/footer)
- [x] 5–8: דף הבית, קטלוג עם סינון/חיפוש/מפרט, עמוד מוצר, עגלה + מגירה
- [x] 9–10: קופה (Server Action → WF13 `order`) ומעקב הזמנה (`/orders/[n]`, `/track`)
- [x] 11–12: וידג'ט שירות לקוחות צף (WF13 `support`), עמודי `/about` ו-`/policies`
- [x] 13: סבב ליטוש RTL, reduced-motion וביצועים (c65e18f)
- [x] 14: חבילת e2e (9 בדיקות), פריסה ל-production, חיבור STORE_DOMAIN, תיעוד
- **פרודקשן: https://ai-electronics-one.vercel.app** — פרויקט Vercel `ai-electronics` (felix-7978), 5 משתני env סונכרנו ל-production+preview.
- ירוק: typecheck, vitest, e2e 9/9 מקומית (יצרה את ORD-0008), 8/8 מול פרודקשן עם `E2E_NO_ORDER=1`.
- מייל האישור מפנה עכשיו לחנות: `STORE_DOMAIN` ב-`n8n/config.json`, WF10 יובא מחדש והופעל.
- תיעוד: `docs/runbook.md` §11 (החנות), `docs/demo.md` — מסלול הלקוח, `store/README.md`.

### פתוח לפני ההגשה
- [ ] לשנות שם ללקוח CUST-0002 ("בדיקה חנות") לשם דמו אמיתי; גם הזמנת ה-e2e ("בדיקת E2E", ORD-0008) — למחוק או לשנות שם.
- [ ] Airtable: שדה `Featured` ב-Products במקום `FLAGSHIP_PREFERENCE` הקשיח ב-`store/src/lib/catalog-filter.ts` — מוצרי הדגל בדף הבית צריכים להיות נתון, לא קוד.
- [ ] להוציא את n8n מהמק לפני ההגשה (ngrok + Docker מקומיים = החנות חיה רק כשהמחשב דולק). קופה, מעקב ובוט תלויים בזה.

- [ ] ליטוש נדחה (2026-09-03): Reveal בגלילה (`animation-timeline: view()`), ₪ fallback באנדרואיד, אחידות צילומי מוצר (חומרה מול שירותים), ספרת שלב עתידי בציר הזמן ב-glow-4, שדה Featured ב-Airtable במקום `FLAGSHIP_PREFERENCE`

## Copy sweep (2026-09-03)
- [x] Native Hebrew selling copy across the store (5dedab2), native-speaker review, fixes (20bf197, 3b7052d): metadata, maqaf, gershayim, סל everywhere, cart aria split.
- [x] Redeployed to production 2026-09-03 (Felix ran the CLI; e2e 8 passed, 1 skipped vs https://ai-electronics-one.vercel.app).
- [x] Bot acceptance pass (2026-09-03): 14 live scenarios; fixed shipping numbers in policy docs (29/300), SKU in product RAG, `handoff` tool (WF5-handoff with contact guard), 8 prompt rules. Map + runbook updated.
- [ ] Bot `order_status` tool (WF10 status path) so "איפה ההזמנה שלי" gets an answer instead of a pointer to /track.
- [ ] Store support timeout: one call in 18 waited ~2 min for the sub-workflow to start (Mac load); `erpCall` budget is 60 s. Consider a "still thinking" retry in the widget or raising the budget.
- [x] Plan 7 (2026-09-03): admin Orders tab + order page (timeline, next-step button, ship-task close), stock editing in products (WF13 field allow-list gained Stock), dashboard to-ship items gated on WF10's ship task. Commits ef719f2..24742bf.
- [ ] Deploy admin app (orders tab, stock, lead source "אתר"): `cd app && vercel --prod --yes` — Felix runs it.
- [ ] invoices/[id] has the same min-width grid overflow at 390 that the order page had (add `min-w-0` on the items section).
