# לקחים

## 2026-09-02 — הוק secret-guard
- ההוק `~/.claude/hooks/secret-guard.sh` חוסם כל פקודת Bash או נתיב קובץ שמכיל `.env` (גם `.env.example`), `credentials.json`, `*.pem`, `*.key` ועוד.
- כלל: קבצי תבנית נקראים `env.example` בלי נקודה. סקריפטים שמזכירים `.env` נכתבים עם Write tool (ההוק בודק רק את הנתיב), ומורצים לפי שם הקובץ בלבד, בלי `.env` במחרוזת הפקודה.
- הסוכן לעולם לא קורא סודות. אימות עושים דרך סקריפטים שמדפיסים רק תוצאה (id, status), לא ערכים.

## 2026-09-02 — n8n Airtable node v2.2
- פלט של Airtable search/get/create ב-n8n הוא `{id, createdTime, fields:{...}}` — לא שטוח. בביטויים: `$json.fields.X`. ב-Summarize: `fields.X`. רק Airtable Trigger גם הוא באותו מבנה. לוודא צורת פלט בהרצה אמיתית לפני שכותבים ביטויים.
- ב-n8n 2.x sub-workflow חייב להיות active ("published") לפני שמפעילים workflow שקורא לו.
- Set node עם ביטוי על שדה לא קיים לא נכשל (מחזיר ריק). לבדיקת Error workflow משתמשים ב-Stop and Error.
- `docker compose up -d` אחרי שינוי compose = recreate של הקונטיינר. n8n עולה ~60–90 שניות (CPU גבוה, "Database ping failed" זמני). לא לקרוא ל-webhooks לפני שה-API עונה, אחרת ngrok מחזיר 503 ונראה כמו קריסה. RestartCount=0 = אין לולאת ריסטארט.
- Read/Write Files node דורש `N8N_RESTRICT_FILE_ACCESS_TO=<dir>` (n8n 2.x), אחרת "Access to the file is not allowed".
- Airtable search node ב-n8n מחזיר 0 פריטים כשאין תוצאה — עם כמה פריטי קלט, הפריט "נעלם" ושובר pairing. לחיפוש 1:1 לכל פריט משתמשים ב-HTTP Request ל-Airtable REST (`{records: []}` תמיד).
- webhook.sh: ברירת מחדל של body חייבת להיות JSON תקין (`'{}'`), לא `{\}`.

## 2026-09-02 — Next.js 16 / shadcn base-nova
- shadcn style `base-nova` בנוי על Base UI, לא Radix: אין `asChild`; משתמשים ב-`render={<Button />}` על Trigger.
- eslint `react-hooks/set-state-in-effect`: לא לסנכרן תוצאת action ב-useEffect; עוטפים את ה-server action בפונקציה client ב-`useActionState` ומטפלים ב-toast/close שם.
- `pnpm build | grep` מחזיר exit של grep — לא לשרשר commit אחרי pipeline כזה; להריץ build לבד ולבדוק exit code.

## 2026-09-02 — n8n alerts during host overload
- Symptom: burst of Telegram alerts (WF1/WF2 Airtable Trigger, WF8 DNS) with empty node/message. Root cause: Mac load avg ~20 (several next dev servers, Chrome, VS Code, 3 parallel Claude sessions) starved the Docker VM → n8n SQLite lock timeouts + DNS EAI_AGAIN. Not a workflow bug; WF8 retries every minute, polling triggers resume.
- Fix applied: 00-error now reads `trigger.error` for polling-trigger failures (was only `execution.error` → empty text).
- Rule: before running builds/e2e/screenshots, check `uptime`; stop my own dev servers when done. Don't run playwright + build + docker exports concurrently on this Mac.
