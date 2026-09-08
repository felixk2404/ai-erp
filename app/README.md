# app — חדר הבקרה של איי.איי אלקטרוניקה

אפליקציית הניהול (Next.js 16, App Router, RTL עברית, כהה בלבד).
אחות של `store/` (החנות) — פרויקט נפרד לגמרי: `package.json` משלו, `node_modules` משלו, פרויקט Vercel נפרד.

**פרודקשן: https://ai-erp-rho.vercel.app** (פרויקט Vercel `ai-erp`). הכניסה מוגנת בסיסמה.
פריסה: `cd app && vercel --prod --yes`. סנכרון env: `./scripts/vercel-env.sh`.

## מה יש בה

דשבורד "חדר בקרה" (הכנסות החודש, תקציר סוכן מוזרם, פיד הרצות n8n חי, מפת 13 ה-workflows),
ומסכי ניהול לחשבוניות, הזמנות, לקוחות, לידים, מוצרים ומשימות. `⌘K` פותח פלטת פקודות
שגם מדברת עם סוכן המנהל. `?` מציג את קיצורי המקלדת.

**קריאות** הולכות ישירות ל-Airtable. **כתיבות אף פעם לא** — כל שינוי עובר דרך WF13
(`POST /webhook/erp` עם `x-erp-secret`), וזה הגבול היחיד שהאפליקציה לא שולטת בו.

## הרצה

```bash
cd app
pnpm install
pnpm dev        # http://localhost:3100
```

| סקריפט | מה עושה |
|---|---|
| `pnpm dev` | שרת פיתוח על **3100** (החנות על 3200) |
| `pnpm build` / `pnpm start` | בנייה ל-production / הרצה על 3100 |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `eslint` |
| `pnpm test` | Vitest (`src/**/*.test.ts`) |
| `pnpm e2e` | Playwright מול `http://localhost:3100` |

`pnpm build`, `pnpm typecheck`, `pnpm lint` ו-`pnpm test` רצים **בלי** משתני סביבה —
`env()` הוא עצל ונקרא רק בתוך request handler.

## משתני סביבה

```bash
cp env.example .env.local
```

| משתנה | מאיפה | חובה |
|---|---|---|
| `AIRTABLE_PAT` | Airtable → Developer hub, scopes של data + schema | כן |
| `AIRTABLE_BASE_ID` | כבר מלא ב-`env.example` | כן |
| `N8N_WEBHOOK_URL` | כבר מלא — כתובת ה-ngrok של n8n המקומי | כן |
| `N8N_WEBHOOK_SECRET` | אותו ערך שב-`n8n/.env` | כן |
| `APP_PASSWORD` | הסיסמה למסך הכניסה | כן |
| `AUTH_SECRET` | `openssl rand -hex 32` — לפחות 32 תווים | כן |
| `N8N_API_URL` | `https://<ngrok>/api/v1` — לפיד ההרצות ומפת המערכת | לא |
| `N8N_API_KEY` | n8n → Settings → API | לא |

בלי השניים האחרונים האפליקציה עולה כרגיל, ופאנלי ה-n8n מציגים "לא מוגדר" במקום ליפול.

## מבנה

```
src/proxy.ts        אימות (Next 16 middleware) — עוגייה חתומה ב-HMAC
src/app/(app)/      המסכים המוגנים בסיסמה
src/app/(auth)/     מסך הכניסה
src/app/support/    צ'אט השירות הציבורי (אותו WF5-core של הבוט)
src/app/api/pulse/  פיד בריאות n8n
src/lib/            env, airtable, n8n, auth, insights, format, types
src/components/ui/  shadcn base-nova (Base UI — prop `render`, לא `asChild`)
```

CSS לוגי בלבד (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`) — האתר RTL.
נגישות: דילוג לתוכן, `aria-disabled` במקום `disabled` בכפתורי פעולה, מיקוד לשדה השגוי
הראשון, ו-`prefers-reduced-motion` מכובד גלובלית.
