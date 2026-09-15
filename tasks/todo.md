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
- [x] לשנות שם ללקוח CUST-0002 ("בדיקה חנות") לשם דמו אמיתי לפני ההגשה — בוצע, ראו §תוכנית 6
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
- [x] לשנות שם ללקוח CUST-0002 ("בדיקה חנות") לשם דמו אמיתי; גם הזמנת ה-e2e ("בדיקת E2E", ORD-0008) — למחוק או לשנות שם.
  אומת 2026-09-08 ב-`DRY_RUN=1 bash airtable/film-cleanup.sh`: CUST-0002 הוא "יוסי לוי", ORD-0008 נושא את אותו שם, ואין הזמנות בדיקה שנותרו. הבסיס נקי להגשה.
- [ ] Airtable: שדה `Featured` ב-Products במקום `FLAGSHIP_PREFERENCE` הקשיח ב-`store/src/lib/catalog-filter.ts` — מוצרי הדגל בדף הבית צריכים להיות נתון, לא קוד.
- [x] הוחלט 2026-09-03: n8n נשאר על המק (Render חינמי נרדם אחרי 15 דקות ובלי דיסק קבוע). צ'ק-ליסט ליום ההצגה ב-`docs/demo.md` (caffeinate, Docker, tunnel).

- [ ] ליטוש נדחה (2026-09-03): Reveal בגלילה (`animation-timeline: view()`), ₪ fallback באנדרואיד, אחידות צילומי מוצר (חומרה מול שירותים), ספרת שלב עתידי בציר הזמן ב-glow-4, שדה Featured ב-Airtable במקום `FLAGSHIP_PREFERENCE`

## Copy sweep (2026-09-03)
- [x] Native Hebrew selling copy across the store (5dedab2), native-speaker review, fixes (20bf197, 3b7052d): metadata, maqaf, gershayim, סל everywhere, cart aria split.
- [x] Redeployed to production 2026-09-03 (Felix ran the CLI; e2e 8 passed, 1 skipped vs https://ai-electronics-one.vercel.app).
- [x] Bot acceptance pass (2026-09-03): 14 live scenarios; fixed shipping numbers in policy docs (29/300), SKU in product RAG, `handoff` tool (WF5-handoff with contact guard), 8 prompt rules. Map + runbook updated.
- [ ] Bot `order_status` tool (WF10 status path) so "איפה ההזמנה שלי" gets an answer instead of a pointer to /track.
- [ ] Store support timeout: one call in 18 waited ~2 min for the sub-workflow to start (Mac load); `erpCall` budget is 60 s. Consider a "still thinking" retry in the widget or raising the budget.
- [x] Plan 7 (2026-09-03): admin Orders tab + order page (timeline, next-step button, ship-task close), stock editing in products (WF13 field allow-list gained Stock), dashboard to-ship items gated on WF10's ship task. Commits ef719f2..24742bf.
- [ ] Deploy admin app (orders tab, stock, lead source "אתר"): `cd app && vercel --prod --yes` — Felix runs it.
- [x] invoices/[id]: נוסף `min-w-0` לעמודת הפריטים בסקירת 15.9; בדיקת פרטי החשבונית בדפדפן עברה.

## סקירת פרויקט מלאה (2026-09-08)

ארבע סקירות מקבילות (app, n8n, store+airtable, תיעוד) ואימות ידני של כל ממצא.

### תוקן
- [x] **WF3 שלח אחרי שסימן.** הסדר היה `Sales Agent → Mark Contacted → Send Email`, כך שכשל ב-Gmail
      הוציא את הליד מ-`New` בלי לשלוח כלום ואיבד אותו לצמיתות. הוחלף ל-`Send Email → Mark Contacted`,
      עם `retryOnFail` על השליחה והערה בצומת שמסבירה את הבחירה. יובא ל-n8n (נשאר לא פעיל).
- [x] **קריסה על שם מוצר ריק ב-`store/src/lib/product-match.ts`.** התיקון כבר היה ב-`app/` מאז הביקורת
      הלילית ולא הועבר לחנות. הועבר, עם הבדיקה המקבילה.
- [x] **`store/src/lib/airtable.ts`**: גוף שגיאת Airtable דלף להודעת ה-Error; נוסף `AbortSignal.timeout`
      של 8 שניות שהיה חסר. עכשיו זהה להתנהגות של `app/`.
- [x] **מפתח זיכרון של סוכן המנהל.** `Chat Input` ב-WF13 העביר `sessionId` בלי קידומת בזמן ש-`Support Input`
      כן מקדים `web-`; מי שמחזיק בסוד יכול היה להעביר את ה-chat id של הבעלים ולהמשיך את שיחתו.
      הקידומת `app-` נוספה. WF13 יובא ואומת בקריאה חיה לפני ואחרי — אותה תשובה.
- [x] **ארבע גישות למילון דרך `in`/סוגריים** (`insights.ts`, `status.ts`, `lead-source.ts`, `task-source.ts`)
      החזירו ערכים מה-prototype עבור סטטוס בשם `toString`/`constructor`. הוחלף ב-`Object.hasOwn`.
- [x] **`airtable/film-cleanup.sh` מחק בלי שאלות.** נוספו `DRY_RUN=1`, אישור מפורש, ו-`FORCE=1` לסקריפטים.
- [x] **README בשורש** (ארכיטקטורה, מפת ריפו, טבלת workflows, מגבלות ידועות) ו-**`app/README.md`** שהיה
      עדיין ה-boilerplate של `create-next-app`. `N8N_API_URL`/`N8N_API_KEY` נוספו ל-`app/env.example`.
- [x] **`.gitignore`**: `.playwright-mcp/`, `.superpowers/`, `test-results/`, `*.tsbuildinfo`. 226 קבצים
      לא מנוטרים ירדו ל-0.

### נמצא ולא תוקן — החלטה מודעת
- מרוצי מספור ומלאי ב-WF10, והגבלת קצב בזיכרון: מתועדים כמגבלות ידועות בראנבוק וב-README.
  מגבלה מתועדת מראה שיפוט; תיקון חפוז לפני הגשה מסכן מסלול שעובד.
- WF4 מסמן `Qualified` על כל תשובה, כולל אוטו-רספונדר ובקשת "הסר". תיקון אמיתי דורש סיווג כוונה.
- WF6/WF7 מוחקים לפני שמטמיעים בלי rollback — חלון קצר שבו ה-RAG ריק.
- סוד webhook יחיד לארבע רשויות (`/erp`, `/run-sales`, `/reindex-*`). הפרדה לשני סודות היא השיפור הנכון.
- כפילות שכבת ה-lib בין `app/` ל-`store/` — השורש של שניים מהבאגים שתוקנו כאן.
- `next/image` על `ImageUrl` שרירותי מול whitelist של supabase בלבד. כל 34 המוצרים תקינים היום; רדום.

## סקירת תאימות למסמך הקורס (2026-09-15) — הושלם

תוכנית: `docs/superpowers/plans/2026-09-15-09-brief-compliance.md`. כל סעיף עם בדיקה שנכשלה קודם ועברה אחרי.

- [x] מע"מ לפי תאריך המסמך (17% לפני 1.1.2025) — WF1 `Compute`; `n8n/code/vat-rate.js` + בדיקות. `0dffe73`
- [x] WF8 כל דקה — אומת חי, שלוש הרצות במרווח 60 שניות. `8bdb023`
- [x] סתירת סטטוס ההזמנה בין המדיניות לפרומפט — `03-shipping-and-delivery.md`, reindex, הבוט אומת. `10a27f9`
- [x] `create-tables.sh` — `Tasks.Created` בלולאה; `schema.md` — `paid`, שורת Items. `88af3f5`
- [x] פתק דביק בכל 15 ה-workflows — `n8n/scripts/add-sticky-notes.py`, אידמפוטנטי, כולם יובאו. `9ae9dc2`
- [x] WF4 Text Classifier: מעוניין → Qualified + משימה; לא מעוניין / "הסר" → Dead + הערה; אוטומטי → Ignored. יובא ואומת בקריאה חוזרת. **בדיקה חיה עם תשובה אמיתית — פתוחה** (demo.md צעד 6ב).
- [x] חיפוש בלידים + `lib/search-formula.ts` משותף (3 בדיקות). `07ed3f7`
- [x] חיפוש + סינון חשבוניות בלקוחות. `3eaee16`
- [x] חיפוש + סינון סטטוס במשימות. `f53051b`
- [x] טופס "הזמנה חדשה" בניהול דרך WF13 `order` → WF10; `erpOrder` (3 בדיקות), `orders/parse.ts` (5 בדיקות). תיקון "נקה" בהזמנות. `7734aaa`
- [x] e2e: 4 בדיקות @compliance + בדיקת הזמנה אמיתית עם דגל `E2E_REAL_ORDER=1`. אומת פעם אחת: ORD-0010, INV-0012 (מע"מ 33.25 על 218), משימת משלוח, מלאי 32→31; נוקה עם `film-cleanup.sh`, המלאי הוחזר ידנית ל-32 (seed-stock לא מאפס מלאי קיים). `74fdaa0`, `911aa42`
- [x] README: טבלת "המסמך אמר / בנינו / למה", מספרי בדיקות מעודכנים; runbook + demo. `10dac34`
- [ ] **פריסה** — `cd app && vercel --prod --yes` (Felix; הסוכן חסום מפריסות).
- [ ] **WF4 חי** — להשיב למייל קר מליד Contacted: פעם "מעוניין", פעם "הסר"; לרשום כאן את מזהי ההרצות.
- [ ] ngrok לא רץ מאז 8.9 — הבוטים שקטים עד `n8n/scripts/tunnel.sh`.

### נשאר בכוונה (מתועד ב-README, טבלת הסטיות)
סוג מסמך יחיד (אין `DocType` בסכימת הקורס) · "משימות להיום" (אין תאריך יעד) · זיכרון שיחה ב-`memoryBufferWindow` · `returnAll` אצל המנהל.


## Google watchdog — WF-Health (2026-09-15)

- [x] תבנית `11-google-health.json`: כל שעה, שתי קריאות עם retry פעמיים, עצירה בכשל ו-`alwaysOutputData` לתוצאות ריקות; פתק דביק אחד.
- [x] WF-Error: הוראת Reconnect מותנית; יובא לפני הפעלת הבדיקה.
- [x] ייבוא חי: `WF-Health — בריאות Google  id=xLVghmOle8B4SWuo  active=true`; WF-Error `id=WeWGjptjpf66sA7T active=true`.
- [x] **בדיקה שלילית אמיתית:** הרצה **4318**, `mode=trigger`, `status=error`, צומת `Gmail Probe`, הודעה `The credential "Gmail ERP" needs to be reconnected. (item 0)`. תזמון הוקצר זמנית לדקה כדי להפעיל הרצת production; הוחזר לשעה ואומת `active=true`. הרצה ידנית אינה מפעילה WF-Error.
- [x] **התראה:** WF-Error הרצה **4319**, `mode=error`, `status=success`, צומת אחרון `Telegram Owner`, מקור `4318`. תשובת Telegram: `ok=true`, `message_id=155`; הטקסט כולל `🔑 טוקן Google פג. n8n → Credentials → Gmail ERP / Google Drive ERP → Reconnect.` (אישור מסירה מה-API, לא אישור שהבעלים קרא).
- [ ] **בדיקה חיובית ממתינה לבעלים:** Reconnect ל-Gmail ERP ול-Google Drive ERP, ואז להריץ ולתעד מזהה הצלחה שבו Every Hour → Gmail Probe → Drive Probe → Healthy. Gmail עדיין פג בבדיקה; Drive טרם הגיע לביצוע.
- [x] `cd n8n/code && node --test`: `tests 30; pass 30; fail 0`.
- [x] `cd app && pnpm test && pnpm typecheck && pnpm lint`: `Test Files 26 passed; Tests 130 passed`, `tsc --noEmit` ו-`eslint` exit 0.
- [x] `bash scripts/export-workflows.sh`: יוצאו כל 16 ה-workflows; קובצי exported נוצרו רק בסקריפט.
- [x] תיעוד ומפה: 16 תבניות בריפו, 14 במניפסט (ORDER ו-HANDOFF לא היו במפה); מסמכי תכנון היסטוריים נשארו כפי שנכתבו.
- [ ] בעלים: מעבר OAuth ל-In production וחיבור מחדש; פריסת אפליקציית הניהול אחרי מיזוג ו-pull.

## סקירת תיקונים — 15.9.2026

דוח ופקודות המשך לקלוד: [claude-project-audit-2026-09-15.md](claude-project-audit-2026-09-15.md).

- [x] אימות בכל פעולות הניהול, תיקון הפניה ב-login ומגבלת ניסיונות.
- [x] חוזי n8n, משכי המתנה, תוצאת הזמנה לא ודאית, WF3 בלי לידים וניטור עם דפדוף.
- [x] מק״ט מוצר, שחזור סל, רוחב חשבונית, ולידציית WF10 וביטול retry מסוכן.
- [x] ייצוא שלא דורס גיבוי כש-API נכשל; ששת ה-workflows המתוקנים יובאו.
- [x] ניהול 168, חנות 127, n8n 34, בדיקת ייצוא 1; שתי בניות Webpack; 12 בדיקות דפדפן; Airtable schema OK.
- [x] בדיקת קלט פסול חיה: WF10 הרצה **4333**, הסתיימה ב-Result Error בלי כתיבות.
- [ ] Google/WF4 חי, אטומיות הזמנות ו-RAG מדורג — הוראות וקריטריוני קבלה בדוח.
- המשך הסקירה, לפי הנחיית המשתמש: **workflows בלבד**. אין משימות המשך לסרט או לאתרים בסקירה הזו.
