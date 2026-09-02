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

## 7. workflows (n8n)
מקור: `n8n/workflows/*.json` (תבניות עם placeholders). ייבוא/עדכון: `n8n/scripts/import-workflow.sh n8n/workflows/<file> --activate`. ייצוא מהשרת: `n8n/scripts/export-workflows.sh` → `n8n/workflows/exported/`. הרצות: `n8n/scripts/executions.sh "<שם>" [n]`.

| workflow | טריגר | איך בודקים |
|---|---|---|
| WF-Error | Error Trigger (מוגדר בכל workflow) | שגיאה בכל workflow → טלגרם למנהל |
| WF1 אימות חשבוניות | Airtable Trigger, Invoices.Created, כל דקה | `api-test.sh` create Invoice → validated + INV-000N + מע"מ, או error |
| WF2 לידים | Airtable Trigger, Leads.Created | ליד → New; מייל קיים → Duplicate |
| WF3 מכירות (מייל קר) | כל 3 שעות + `webhook.sh run-sales` | ליד New → מייל נשלח → Contacted |
| WF4 מכירות (תשובות) | Gmail Trigger כל 30 דק' | תשובה מהליד → Qualified |
| WF5 שירות לקוחות | Telegram @aielec_support_bot | שאלה על מדיניות/מוצר → תשובה מ-RAG |
| WF6 מדיניות → RAG | `webhook.sh reindex-policies` | `rag-count.sh` → policy: ~79 |
| WF7 מוצרים → RAG | `webhook.sh reindex-products` | `rag-count.sh` → product: 34 |
| WF8 PDF | כל דקה, Invoices.Status=validated | PdfUrl בדרייב, Status generated |
| WF9 מנהל (טלגרם) | Telegram @aielc_manager_bot, רק Chat ID של הבעלים | "מה ההכנסות?" |
| WF9-core | Execute Workflow (מ-WF9 ו-WF13) | דרך WF13 chat |
| WF13 API | `POST /webhook/erp` + header `x-erp-secret` | `n8n/scripts/api-test.sh '{"action":"chat","message":"..."}'` |

ייבוא מחדש מאפס (סדר חשוב): `00-error`, `09b-manager-core`, ואז השאר. אחרי שינוי מדיניות (`docs/course/policies`) — `webhook.sh reindex-policies`. אחרי שינוי מוצרים — `webhook.sh reindex-products`.
הנחיות הסוכנים: `n8n/prompts/*.md` — אחרי שינוי מייבאים מחדש את ה-workflow הרלוונטי.

## 8. האפליקציה (Next.js)
- פרודקשן: **https://ai-erp-rho.vercel.app** (פרויקט Vercel `ai-erp`, סיסמת כניסה ב-`APP_PASSWORD`).
- מקומי: `cd app && pnpm dev` → http://localhost:3100 (3100 ולא 3000 — פורט 3000 תפוס אצל פרויקט אחר במחשב).
- env: `cp app/env.example app/.env.local` וממלאים; או מייצרים מ-`n8n/.env` (הפקודה בשיחה מ-2026-09-02). `AUTH_SECRET` = `openssl rand -hex 32`.
- בדיקות: `pnpm test` (Vitest, 31), `pnpm e2e` (Playwright, 5 — קורא APP_PASSWORD מ-.env.local), `PLAYWRIGHT_BASE_URL=https://ai-erp-rho.vercel.app pnpm e2e` מול פרודקשן.
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
- ⌘K חיפוש גלובלי, מעברי עמוד (View Transitions), עמודי פרט `/invoices/[id]`, `/customers/[id]`.

## 6. מלכודות שנתקלנו בהן
- הוק secret-guard חוסם כל פקודה עם `.env`; הסקריפטים טוענים דרך `scripts/load-env.sh`.
- TextEdit מכניס תווי כיווניות נסתרים וגרשיים חכמים — load-env מנקה.
- סיסמת DB עם `#`/`$` — load-env מקודד אוטומטית; מרכאות בודדות סביב הערך ב-.env.
- Airtable Metadata API לא יוצר שדה Created time — מוסיפים ידנית, הסקריפט משנה שם ל-`Created`.
- Gotenberg: Chromium איטי בהפעלה ראשונה — timeout 90s ב-compose.
