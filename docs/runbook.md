# Runbook — הקמה מאפס

## 1. חשבונות
| שירות | מה צריך | איפה נשמר |
|---|---|---|
| ngrok | authtoken + static domain | n8n/.env |
| Airtable | PAT עם data + schema scopes | n8n/.env |
| OpenAI | API key | n8n/.env |
| Telegram | שני בוטים מ-BotFather, chat id של הבעלים | n8n/.env |
| Supabase | project url, service_role key, DB URI | n8n/.env |
| Google Cloud | פרויקט עם Gmail + Drive API, OAuth client | n8n UI (Task 8) |

התבנית היא `n8n/env.example`. מעתיקים ל-`n8n/.env` וממלאים ידנית. הסוכן (Claude) חסום מקריאה וכתיבה לקובץ הזה על ידי הוק מקומי, ולכן כל סקריפט ב-`n8n/scripts` קורא את הסודות בעצמו בזמן ריצה.

תיקיית Drive לחשבוניות: `AI-ERP Invoices`, ID: `1XADLI0r9ha9qbDHS1H5U-DvBZKvMIkjq`
https://drive.google.com/drive/folders/1XADLI0r9ha9qbDHS1H5U-DvBZKvMIkjq

## 2. הרצה יומית
```bash
cd n8n && docker compose up -d      # n8n + gotenberg
n8n/scripts/tunnel.sh               # טרמינל נפרד, משאירים פתוח
```
n8n מקומי: http://localhost:5678 · ציבורי: https://goofy-glamour-syrup.ngrok-free.dev
בדיקת סביבה: `n8n/scripts/verify-env.sh` · סכימת Airtable: `airtable/verify-schema.sh` · Supabase: `n8n/scripts/diagnose-supabase.sh`

## 3. Google OAuth
Google Cloud project: `Default Gemini Project` (gen-lang-client-0155888723). OAuth client `n8n-erp`, Web application,
redirect URI `https://goofy-glamour-syrup.ngrok-free.dev/rest/oauth2-credential/callback`.
Audience: External, Testing, test user = המייל של הסטודנט. במצב Testing ה-refresh token פג אחרי 7 ימים:
אם Gmail/Drive אדומים ב-n8n → Credentials → פותחים → Reconnect. עושים זאת ביום הדמו.

## 4. credentials ב-n8n (שמות מדויקים, תוכנית 2 מפנה אליהם)
Airtable ERP · OpenAI ERP · Telegram Manager · Telegram Customer · Supabase ERP · ERP Webhook Secret · Gmail ERP · Google Drive ERP

## 5. בוטים
מנהל: @aielc_manager_bot (Chat ID של הבעלים: 43590648) · לקוחות: @aielec_support_bot

### 5.1 חנות — מלאי התחלתי
מלאי התחלתי: `airtable/seed-stock.sh` (דטרמיניסטי, בטוח להרצה חוזרת; משאיר לפחות שני מוצרים ב-Stock=0 להדגמת "אזל מהמלאי" — כרגע `TY-CB-HD21` ו-`TY-MN-34U`).

## 7. workflows (n8n)
מקור: `n8n/workflows/*.json` (תבניות עם placeholders). ייבוא/עדכון: `n8n/scripts/import-workflow.sh n8n/workflows/<file> --activate`. ייצוא מהשרת: `n8n/scripts/export-workflows.sh` → `n8n/workflows/exported/`. הרצות: `n8n/scripts/executions.sh "<שם>" [n]` — צריך את השם המלא של ה-workflow (למשל `"WF5-core — סוכן שירות לקוחות"`), לא רק את המספר.

| workflow | טריגר | איך בודקים |
|---|---|---|
| WF-Error | Error Trigger (מוגדר בכל workflow) | שגיאה בכל workflow → טלגרם למנהל |
| WF1 אימות חשבוניות | Airtable Trigger, Invoices.Created, כל דקה | `api-test.sh` create Invoice → validated + INV-000N + מע"מ, או error; חשבונית שגויה → משימת "לתקן INV-…" |
| WF2 לידים | Airtable Trigger, Leads.Created | כפילות לפי אימייל, ואם אין — לפי טלפון (digits-only compare); ליד → New; מייל קיים → Duplicate |
| WF3 מכירות (מייל קר) | כל 3 שעות + `webhook.sh run-sales` | ליד New → מייל נשלח → Contacted |
| WF4 מכירות (תשובות) | Gmail Trigger כל 30 דק' | תשובה מהליד → Qualified + משימת "להתקשר ל…" |
| WF5 שירות לקוחות | Telegram @aielec_support_bot | תפריט קטלוג בכפתורים (/menu), "מעוניין" יוצר ליד + משימה + הודעה לבעלים; טקסט חופשי → סוכן; שאלה על מדיניות/מוצר → תשובה מ-RAG |
| WF5-handoff מסירה לנציג | Execute Workflow (כלי `handoff` של WF5-core) | "תתקשרו אליי לגבי 3 מסכים" → שם+טלפון → ליד (Source web/telegram) + משימת "לחזור ל…" + הודעה לבעלים; `api-test.sh` support |
| WF6 מדיניות → RAG | `webhook.sh reindex-policies` | `rag-count.sh` → policy: ~79 |
| WF7 מוצרים → RAG | `webhook.sh reindex-products` | `rag-count.sh` → product: 34 |
| WF8 PDF | כל 5 דקות, Invoices.Status=validated ולא תפוסה | PdfUrl בדרייב, Status generated |
| WF9 מנהל (טלגרם) | Telegram @aielc_manager_bot, רק Chat ID של הבעלים | "מה ההכנסות?" |
| WF9-core | Execute Workflow (מ-WF9 ו-WF13) | דרך WF13 chat |
| WF10 הזמנה מהחנות | Execute Workflow (מ-WF13 order) | `n8n/scripts/order-test.sh happy\|oos\|bad\|service\|status ORD-000N`; הזמנה פיזית → משימת "לשלוח ORD-…", מלאי נמוך → משימת "להזמין מלאי" |
| WF13 API | `POST /webhook/erp` + header `x-erp-secret` | `n8n/scripts/api-test.sh '{"action":"chat","message":"..."}'` |

- **משימות (Tasks)**: תור פעולות אנושיות. WF10 יוצר "לשלוח ORD-…" לכל הזמנה פיזית ו"להזמין מלאי" כשמלאי יורד מתחת ל-3 (בלי כפילות לאותו מק"ט). WF4 יוצר "להתקשר ל…" לליד שענה. סוכן השירות יוצר "לחזור ל…" כשלקוח משאיר שם וטלפון (WF5-handoff). WF1 יוצר "לתקן INV-…" לחשבונית שגויה. `Source` + `RefId` מקשרים למסך היעד באפליקציה. סוכן המנהל מקבל `open_tasks`.

פעולות WF13: `create` · `chat` · `update` · `support` · `order` (מריץ את WF10) · `order_status` (`{orderNumber,email}` → סטטוס ההזמנה + PdfUrl של החשבונית).

- **תפריט טלגרם (WF5)**: `/start` או `/menu` פותח כפתורי קטגוריות → מוצרים → מפרט → "מעוניין". הלוגיקה ב-`n8n/code/classify.js` ו-`n8n/code/render-menu.js` (בדיקות: `node --test "n8n/code/*.test.js"`), מוזרקת ל-workflow בייבוא (`__CODE_NAME__`). המצב חי ב-`callback_data`; הטלפון מתחבר לליד לפי `TelegramChatId`. ליד מטלגרם: `Source=telegram`, בלי אימייל, ולכן WF3 לא שולח לו מייל קר.
- כפתורי התפריט (`Edit Menu`, `Send Menu`, `Confirm Lead`) נשלחים ל-Telegram Bot API ישירות מצומתי HTTP Request, כי צומת ה-Telegram של n8n לא יכול לקבל מקלדת דינמית; טוקן הבוט מגיע לצמתים האלה דרך `$env.TELEGRAM_CUSTOMER_TOKEN`, ש-`n8n/docker-compose.yml` מזריק לקונטיינר מקובץ ה-env (git-ignored).

### 7.1 חוזה WF13 לחנות (מקור האמת)
כל הקריאות: `POST https://<NGROK_DOMAIN>/webhook/erp`, `Content-Type: application/json`, header `x-erp-secret: <N8N_WEBHOOK_SECRET>`.

**קודי HTTP:** `200` לכל תשובה עסקית — גם `ok:true` וגם `ok:false` (שגיאת ולידציה, מלאי, הזמנה לא נמצאה). `400` ל-action לא מוכר. `403` ל-secret שגוי או חסר. החנות בודקת תמיד את `ok` בגוף התשובה, לא רק את קוד ה-HTTP.

**`order`** — יוצר הזמנה (WF13 מריץ את WF10 כ-sub-workflow):
```json
{ "action": "order", "order": {
  "customer": { "name": "דוד לוי", "email": "d@example.com", "phone": "050-0000000", "address": "הרצל 1", "city": "תל אביב" },
  "items": [ { "sku": "TY-PB-20", "qty": 1 } ],
  "note": "אופציונלי, עד 500 תווים" } }
```
תשובה תקינה:
```json
{ "ok": true, "orderNumber": "ORD-0003", "invoiceNumber": "INV-0005",
  "subtotal": 189, "shipping": 29, "vat": 33.25, "total": 218,
  "items": [ { "sku": "TY-PB-20", "name": "סוללת גיבוי 20,000mAh TY-Power", "qty": 1, "price": 189 } ] }
```
שגיאת ולידציה — ההודעות מופרדות בפסיק: `{ "ok": false, "error": "שם חסר, אימייל לא תקין" }`.
חוסר מלאי:
```json
{ "ok": false, "error": "חלק מהפריטים אינם במלאי בכמות המבוקשת",
  "outOfStock": [ { "sku": "TY-HP-200", "name": "אוזניות אלחוטיות TY-200", "available": 2 } ] }
```
`available` הוא לשימוש פנימי בלבד — **החנות לא מציגה אותו** ללקוח (המלאי משתנה בין הבקשה לתצוגה), אלא רק את שמות הפריטים החסרים.
כשל בשמירה (WF10 נופל אחרי שהחל לכתוב): `{ "ok": false, "error": "שגיאה זמנית בשמירת ההזמנה. ייתכן שההזמנה נשמרה — בדקו בעמוד מעקב ההזמנה לפי האימייל." }`.

**מגבלות ולידציה:** עד **10 שורות** שונות בהזמנה (מגבלת batch של Airtable ב-PATCH); `qty` בין 1 ל-**99** לכל שורה, גם אחרי מיזוג כפילויות של אותו מק"ט; כתובת ועיר נדרשות אם יש פריט פיזי אחד לפחות. מחיר תמיד נלקח מהקטלוג, לעולם לא מהדפדפן.

**`order_status`** — `orderNumber` לא רגיש לאותיות (`ord-0001` = `ORD-0001`); האימייל חייב להתאים להזמנה:
```json
{ "action": "order_status", "orderNumber": "ORD-0001", "email": "d@example.com" }
```
```json
{ "ok": true, "order": { "orderNumber": "ORD-0001", "status": "confirmed",
  "items": [ { "sku": "...", "name": "...", "qty": 1, "price": 349 } ],
  "subtotal": 439, "shipping": 0, "total": 439, "created": "2026-09-02T14:37:30.000Z",
  "invoiceNumber": "INV-0003", "pdfUrl": "https://drive.google.com/...", "invoiceStatus": "generated" } }
```
לא נמצא: `{ "ok": false, "error": "ההזמנה לא נמצאה" }`. `pdfUrl`/`invoiceStatus` הם `null` עד ש-WF8 מייצר את ה-PDF (עד כ-7 דקות אחרי ההזמנה — פולינג של 5 דקות ועוד כדקה-שתיים של הפקה).

**`support`** — צ'אט שירות לקוחות. הזיכרון בצד השרת לפי `sessionId` (WF13 מוסיף קידומת `web-`), ולכן **אין** לשלוח היסטוריית שיחה מהדפדפן:
```json
{ "action": "support", "message": "יש במלאי TY-HP-200?", "sessionId": "מזהה יציב לכל דפדפן" }
```
```json
{ "ok": true, "reply": "כן, TY-HP-200 נמצא במלאי. המחיר הוא 349 ₪ כולל מע\"מ." }
```

אם המייל נכשל (OAuth של Gmail פג) — ההזמנה נשמרת, מסומנת `confirmed`, והחנות מקבלת תשובה תקינה; חסר רק אישור המייל ללקוח. Reconnect ל-Gmail credential ושולחים את האישור ידנית. איך מזהים שהמייל נכשל: ראו סעיף 6 (מלכודות).

מלכודת n8n: ב-httpRequest, שני פרמטרים ב-Query Parameters עם אותו שם (למשל `fields[]`) נדרסים — רק האחרון נשלח. לרשימת `fields[]` יש לשרשר אותם ל-URL עצמו (כמו ב-WF10 `Last Order`) או לוותר עליהם.

ייבוא מחדש מאפס (סדר חשוב): `00-error`, `09b-manager-core`, ואז השאר. אחרי שינוי מדיניות (`docs/course/policies`) — `webhook.sh reindex-policies`. אחרי שינוי מוצרים — `webhook.sh reindex-products`.
הנחיות הסוכנים: `n8n/prompts/*.md` — אחרי שינוי מייבאים מחדש את ה-workflow הרלוונטי.

## 8. האפליקציה (Next.js)
- פרודקשן: **https://ai-erp-rho.vercel.app** (פרויקט Vercel `ai-erp`, סיסמת כניסה ב-`APP_PASSWORD`).
- מקומי: `cd app && pnpm dev` → http://localhost:3100 (3100 ולא 3000 — פורט 3000 תפוס אצל פרויקט אחר במחשב).
- env: `cp app/env.example app/.env.local` וממלאים; או מייצרים מ-`n8n/.env` (הפקודה בשיחה מ-2026-09-02). `AUTH_SECRET` = `openssl rand -hex 32`.
- בדיקות: `pnpm test` (Vitest, 55), `pnpm e2e` (Playwright, 5 — קורא APP_PASSWORD מ-.env.local), `PLAYWRIGHT_BASE_URL=https://ai-erp-rho.vercel.app pnpm e2e` מול פרודקשן.
- צילומי מסך של כל המסכים: `OUT=<dir> node e2e/screens.mjs`.
- פריסה: `cd app && vercel --prod --yes`. סנכרון env ל-Vercel: `./scripts/vercel-env.sh` (קורא .env.local, לא מדפיס ערכים; מדלג על VERCEL_*).
- כשהמק כבוי: האפליקציה עולה וקוראת מ-Airtable, אבל כל כתיבה/צ'אט (דרך n8n המקומי ב-ngrok) נכשלים עם toast "n8n 502/503". לדמו: Docker + `n8n/scripts/tunnel.sh` חייבים לרוץ.
- ארכיטקטורה: קריאה = Server Components → Airtable REST (PAT בשרת). כתיבה = Server Actions → WF13 (`create`/`update`/`chat`) ו-webhooks `run-sales`, `reindex-products`. אימות = cookie HMAC ב-`src/proxy.ts`.

## 9. פרמיום (תוכנית 4)
- **שירות לקוחות באתר**: `https://ai-erp-rho.vercel.app/support` — ציבורי, בלי סיסמה. אותו סוכן כמו הטלגרם (WF5-core), דרך `WF13 action:"support"`. Rate limit 20 הודעות/דקה ל-IP. וידג'ט צף גם בתוך האפליקציה.
- **RAG בשני כלים**: `products_catalog` (metadata type=product, topK 8) ו-`knowledge_base` (type=policy, topK 5). אחרי שינוי מוצרים: `n8n/scripts/webhook.sh reindex-products`.
- **תמונות**: Supabase Storage bucket `assets` (public) → `Products.ImageUrl`. יצירה: fal.ai `fal-ai/nano-banana-2` (~$0.08/תמונה). העלאה: `n8n/scripts/upload-asset.sh <url|file> products/<SKU>.webp <recId>`. נכסי מותג ב-`app/public/brand/`.
- **מק"ט**: שדה `Products.Sku` (חולץ מהתיאור ב-`airtable/backfill-sku.sh`). שדות חדשים: `airtable/add-fields.sh`.
- **דשבורד**: תקציר בוקר (סוכן המנהל, cache 6 שעות, כפתור רענן), דורש-טיפול (חשבוניות error / פתוחות > 14 יום / לידים Contacted > 7 יום), בריאות n8n (דורש `N8N_API_URL=https://goofy-glamour-syrup.ngrok-free.dev/api/v1` ו-`N8N_API_KEY` ב-.env.local וב-Vercel), גרפים בגוון יחיד.
- **PDF בעמוד חשבונית**: iframe של Drive preview. WF8 משתף כל PDF אוטומטית כ-"כל מי שיש לו את הקישור — צופה" (צומת Share Public) — לכן ה-preview עובד גם בלי חשבון Google.
- **שורות חשבונית**: `Invoices.Items` (JSON `[{sku,name,qty,price}]`). הטופס בוחר מוצרים מהקטלוג, השרת מחשב Amount מהשורות (`src/lib/invoice-items.ts`), WF1 מוסיף מע"מ 18%, WF8 מדפיס טבלת שורות ב-PDF. חשבוניות ישנות בלי Items מוצגות כסכום בלבד.
- ⌘K חיפוש גלובלי, מעברי עמוד (View Transitions), עמודי פרט `/invoices/[id]`, `/customers/[id]`.

## 10. Night Console (תוכנית 5)
- **עיצוב**: עולם "חדר בקרה" כהה — טוקנים ב-`app/src/app/globals.css` (`--void/--chassis/--readout/--signal`, LED), פונטים Heebo + IBM Plex Sans Hebrew + IBM Plex Mono. הכללים ב-`app/.interface-design/system.md`; ההחלטות ב-`docs/superpowers/specs/2026-09-02-night-console-design.md`.
- **פיד חי + מפת מערכת** (`/api/pulse`, polling 10s): דורשים `N8N_API_URL` + `N8N_API_KEY` (כמו בריאות n8n, סעיף 9). בלי env — המפה מוצגת מהמניפסט (`app/src/lib/workflows.ts`, 13 workflows עם id-ים מ-`n8n/config.json`) במצב OFFLINE. אם מייבאים את ה-workflows למופע n8n אחר — לעדכן את ה-id-ים במניפסט.
- **⌘K עם AI**: הקלדה של 3 תווים ומעלה בפלטה מציעה "שאל את המנהל"; Enter שולח ל-`sendChat` (WF13 chat) והתשובה מוזרמת בפלטה.
- **קיצורי מקלדת**: `?` עזרה · `g` ואז `d/i/l/c/p/t` ניווט · `n` פריט חדש בעמוד · ⌘K חיפוש.
- **תקציר בוקר**: נחשף מילה-מילה (StreamText); בזמן הטעינה פאנל "הסוכן קורא נתונים" עם טיימר.
- **בדיקות**: `pnpm test` (55), typecheck, lint, `pnpm e2e`, `PAGES=/ OUT=<dir> node e2e/screens.mjs` לצילום עמוד יחיד.
- **תנועה**: הכל מכבד prefers-reduced-motion (beams/aurora/led נעצרים). אם המחשב חלש בדמו — אפשר להפעיל reduced motion במערכת ההפעלה.

## 11. החנות (store/)
- פרודקשן: **https://ai-electronics-one.vercel.app** (פרויקט Vercel `ai-electronics`, צוות `felix-7978`). ציבורי לגמרי — אין סיסמה. `ai-electronics.vercel.app` תפוס גלובלית, ולכן ה-alias בפועל הוא `-one`.
- מקומי: `cd store && pnpm dev` → http://localhost:3200 (הניהול על 3100; פורט 3000 תפוס אצל פרויקט אחר במחשב).
- env — 5 משתנים (שמות בלבד): `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`. `cp store/env.example store/.env.local` וממלאים; `AIRTABLE_PAT` ו-`N8N_WEBHOOK_SECRET` מועתקים מהניהול.
- סקריפטים: `store/scripts/check-env.sh` (מדפיס set/MISSING בלבד, לעולם לא ערכים), `store/scripts/vercel-env.sh` (מסנכרן ל-Vercel production+preview; מדלג על `VERCEL_*`, לא מדפיס ערכים).
- בדיקות: `pnpm test` (Vitest), `pnpm e2e` (Playwright, 9 בדיקות — מרים dev server לבד או משתמש בקיים על 3200), ומול פרודקשן: `PLAYWRIGHT_BASE_URL=https://ai-electronics-one.vercel.app E2E_NO_ORDER=1 pnpm e2e`. **`E2E_NO_ORDER=1` מדלג על בדיקת הקופה** — היא יוצרת הזמנה אמיתית ב-Airtable ושולחת מייל, ומספיקה אחת לכל סביבה.
- צילומי מסך של כל העמודים: `OUT=<dir> node e2e/screens.mjs` (גם `BASE_URL=` ו-`PAGES=`).
- פריסה: `cd store && vercel --prod --yes`. אחרי הפריסה הראשונה `NEXT_PUBLIC_SITE_URL` ב-Vercel חייב להיות כתובת הפרודקשן, ואז פריסה נוספת.
- **קישור המעקב במייל האישור**: `n8n/config.json` → `STORE_DOMAIN` (hostname בלבד, בלי סכימה). אחרי שינוי: `n8n/scripts/import-workflow.sh n8n/workflows/10-order.json --activate` ואז `n8n/scripts/export-workflows.sh`. אימות: `n8n/scripts/n8n-api.sh GET /workflows/9l2sTtJMunb5UTFE | grep -o 'https://[^/]*/orders' | head -1`.
- ארכיטקטורה: קריאה = Server Components → Airtable REST (PAT בשרת, `unstable_cache` 60 שניות). כתיבה = Server Actions → WF13 (`order`, `order_status`, `support`). אין אימות ואין סשן — העגלה ב-`localStorage` (`aie-cart-v1`), האימייל למעקב ב-`sessionStorage`.
- כשהמק כבוי: הקטלוג ועמודי המוצר עולים (Airtable ישירות), אבל קופה, מעקב ובוט נכשלים — כולם עוברים דרך n8n המקומי ב-ngrok. לדמו: Docker + `n8n/scripts/tunnel.sh` חייבים לרוץ.
- **מגבלות ידועות**: (1) ה-rate limit (5 הזמנות/דקה, 20 בירורי הזמנה/דקה, 20 הודעות בוט/דקה) יושב בזיכרון התהליך — ב-Vercel כל instance סופר בנפרד, ולכן זו הגנה מפני לחיצות חוזרות ולא מפני תוקף. (2) מספור ORD/INV מחושב מהמקסימום הקיים ולא מנעילה — שתי הזמנות באותה שנייה עלולות לקבל אותו מספר (סעיף 6).

## 6. מלכודות שנתקלנו בהן
- הוק secret-guard חוסם כל פקודה עם `.env`; הסקריפטים טוענים דרך `scripts/load-env.sh`.
- TextEdit מכניס תווי כיווניות נסתרים וגרשיים חכמים — load-env מנקה.
- סיסמת DB עם `#`/`$` — load-env מקודד אוטומטית; מרכאות בודדות סביב הערך ב-.env.
- Airtable Metadata API לא יוצר שדה Created time — מוסיפים ידנית, הסקריפט משנה שם ל-`Created`.
- Gotenberg: Chromium איטי בהפעלה ראשונה — timeout 90s ב-compose.
- WF1 נשבר בעבר כששתי חשבוניות נוצרו באותה דגימה של ה-Airtable Trigger: הצומת `Compute` השתמש ב-`$('Airtable Trigger').item`, ואחרי `Aggregate` השיוך היה מעורפל → `Multiple matches found`, והחשבונית נתקעה ב-`new` בלי שהטריגר יקרא אותה שוב. **תוקן 2026-09-02**: הגוף עטוף ב-`Loop Over Items` (batchSize 1) והביטויים משתמשים ב-`$('Loop Over Items').first()`. אין יותר צורך להגביל להזמנה אחת בדקה.
- Aggregate/Summarize אחרי טריגר מרובה-פריטים שובר את השיוך של `$('Trigger').item` → עוטפים את הגוף ב-Loop Over Items (תיקון WF1, 2026-09-02).
- מספור רץ (ORD/INV) מחושב מהמקסימום הקיים ולא מנעילה. WF10 `Compute` מזהה שליחה חוזרת (אותו אימייל, אותה עגלה, פחות מ-5 דקות) ומחזיר את ההזמנה הקיימת בלי לכתוב — זה מכסה לחיצה כפולה וניסיון חוזר של הדפדפן. **מגבלה ידועה שנשארה: שתי הזמנות שונות באותה שנייה עלולות עדיין לקבל אותו ORD/INV; מקובל לפרויקט.** זיהוי: `airtable/show-records.sh Invoices` וחיפוש כפילויות ב-InvoiceNumber; תיקון ידני של המספר.
- WF10: כשל של `Email Customer` או `Notify Manager` כבר לא מפיל את ההזמנה (`onError: continueRegularOutput`) — ההזמנה מסומנת `confirmed` והחנות מקבלת תשובה תקינה. במצב הזה **ה-Error Workflow לא נורה**, ולכן מייל שנכשל נראה רק ברשימת ההרצות של WF10: `n8n/scripts/executions.sh "WF10 — הזמנה מהחנות"` → פותחים את ההרצה ובודקים את הצומת `Email Customer`.
- **חשבונית תקועה ב-`validated` ולא מקבלת PDF:** WF8 תופס חשבונית בשדה `Invoices.PdfLockedAt` לפני ההפקה, כדי ששתי הרצות לא ייצרו שתי חשבוניות מס לאותה שורה. אם הרצה נפלה באמצע, התפיסה פגה לבד אחרי 15 דקות והחשבונית נבחרת שוב; לזירוז — מוחקים את הערך ב-`PdfLockedAt`. ההרצה הכושלת עצמה מופיעה ב-`n8n/scripts/executions.sh` ומפעילה את WF-Error.
- **קובצי ה-PDF של החשבוניות משותפים כ"כל מי שיש לו את הקישור" (WF8 `Share Public`) — החלטה מודעת:** עמוד ההזמנה של הלקוח מקשר ישירות לחשבונית שלו ואין בפרויקט התחברות לקוחות, והנתונים הם דמו סינתטי. עם נתוני לקוחות אמיתיים זה היה חייב signed URL קצר-מועד (למשל bucket פרטי ב-Supabase Storage) במקום קישור נצחי ובלתי הפיך.
- **התפריט בטלגרם לא מגיב לכפתורים**: `TELEGRAM_CUSTOMER_TOKEN` חסר בסביבת הקונטיינר (docker-compose מעביר אותו מקובץ ה-env). `n8n/scripts/verify-env.sh` בודק; אחרי הוספה — `docker compose up -d` בתיקיית n8n.
