# store — חנות איי.איי אלקטרוניקה

אפליקציית הלקוח (Next.js 16, App Router, RTL עברית, כהה בלבד).
אחות של `app/` (הניהול) — פרויקט נפרד לגמרי: `package.json` משלו, `node_modules` משלו, פרויקט Vercel נפרד.

**פרודקשן: https://ai-electronics-one.vercel.app** (פרויקט Vercel `ai-electronics`, צוות `felix-7978`).
פריסה: `cd store && vercel --prod --yes`. סנכרון env: `./scripts/vercel-env.sh`.

## הרצה

```bash
cd store
pnpm install
pnpm dev        # http://localhost:3200
```

| סקריפט | מה עושה |
|---|---|
| `pnpm dev` | שרת פיתוח על **3200** (הניהול על 3100) |
| `pnpm build` / `pnpm start` | בנייה ל-production / הרצה על 3200 |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `eslint .` |
| `pnpm test` | Vitest (`src/**/*.test.ts`) |
| `pnpm e2e` | Playwright מול `http://localhost:3200` (מרים `pnpm dev` לבד) |
| `PLAYWRIGHT_BASE_URL=<url> E2E_NO_ORDER=1 pnpm e2e` | אותן בדיקות מול פרודקשן, בלי ליצור הזמנה אמיתית |
| `OUT=<dir> node e2e/screens.mjs` | צילומי מסך של כל העמודים (desktop + mobile) |

`pnpm build`, `pnpm typecheck`, `pnpm lint` ו-`pnpm test` רצים **בלי** משתני סביבה —
`env()` הוא עצל ונקרא רק בתוך request handler. גם `/api/health` לא נוגע בו.

## משתני סביבה

```bash
cp env.example .env.local
```

ואז למלא ב-`.env.local`:

| משתנה | מאיפה |
|---|---|
| `AIRTABLE_PAT` | להעתיק מ-`app/.env.local` |
| `AIRTABLE_BASE_ID` | כבר מלא ב-`env.example` (`app1jXGnS2j0tCxEM`) |
| `N8N_WEBHOOK_URL` | כבר מלא — כתובת ה-ngrok של n8n המקומי |
| `N8N_WEBHOOK_SECRET` | להעתיק מ-`app/.env.local` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3200` בפיתוח; `https://ai-electronics-one.vercel.app` ב-Vercel |

בלי הקובץ הזה כל קריאה ל-Airtable או ל-n8n תזרוק `Missing/invalid env: ...`.

## מבנה

```
src/app/          עמודים, layout (גופנים + MotionConfig + Toaster), api/health
src/lib/          env, airtable, n8n, format, rate-limit, types, utils
src/components/ui shadcn base-nova (Base UI — prop `render`, לא `asChild`)
.interface-design/system.md   אסימוני עיצוב, סקאלה, קטלוג התנועה
```

עיצוב: `src/app/globals.css` — בלוק `@theme` עם אסימוני "חדר תצוגה" (`--color-void`, `--color-beam` ...),
ומיפוי שלהם לאסימוני shadcn (`--background`, `--primary` ...). כהה בלבד; ל-`<html>` יש `class="dark"`
כדי ש-`dark:` ברכיבי shadcn ימשיך לעבוד.

CSS לוגי בלבד (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`) — האתר RTL.
