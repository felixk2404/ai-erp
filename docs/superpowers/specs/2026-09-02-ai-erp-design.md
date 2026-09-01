# AI-ERP עם n8n — מסמך עיצוב

תאריך: 2026-09-02
סטטוס: מאושר על ידי הסטודנט, ממתין לתוכנית עבודה
מקור הדרישות: מסמך הקורס "AI-ERP עם n8n — מערכת ניהול עסק חכמה" (ג'ון ברייס)

## 1. מטרה

פרויקט גמר: מערכת ERP קטנה לעסק אלקטרוניקה ישראלי דמיוני, שבה סוכני AI ותהליכי n8n עושים את רוב העבודה. הפרויקט חייב לעמוד בדרישות מסמך הקורס (Airtable, n8n, שלושה סוכנים, RAG, שני בוטי טלגרם, Gmail, Drive) ולהתבלט מעבר למינימום בשלושה מקומות ברורים: אפליקציית ניהול בקוד אמיתי, PDF אמיתי לחשבוניות, ו-RAG שלא נמחק.

זמן: 2–4 שבועות. עובד יחיד. נקודת התחלה: מסמך הקורס ומפתח OpenAI בלבד.

## 2. החלטות מרכזיות

| נושא | החלטה | סיבה |
|---|---|---|
| אפליקציית ניהול | Next.js 16 App Router, Tailwind, shadcn/ui, על Vercel | שליטה מלאה בעיצוב RTL, אבטחה, בולט בהצגה. המסמך מאפשר "פונקציית שרת שמחזיקה את המפתח". |
| הרצת n8n | Docker על המק, חשיפה דרך ngrok static domain | n8n Cloud חינמי רק 14 יום. ngrok נותן כתובת קבועה חינם, ולכן Telegram Trigger לא נשבר בריסטארט. |
| מאגר וקטורי | Supabase pgvector (חינמי) | המסמך משתמש בזיכרון של n8n שנמחק בכל ריסטארט. |
| PDF לחשבונית | Gotenberg בקונטיינר ליד n8n | HTML נכנס, PDF יוצא, צומת HTTP Request אחד. ללא Chromium ב-Vercel, ללא קוד. |
| טיפול בשגיאות | workflow אחד עם Error Trigger שמדווח לטלגרם של המנהל | המסמך מציין שאין טיפול בשגיאות. הרחבה זולה ונראית. |
| טבלאות | 4 מהמסמך + Customers | האפליקציה מציגה שמות לקוחות, לא מזהים. |
| מודלים | OpenAI לצ'אט ול-embeddings | לפי המסמך, תמיכה טובה בעברית. |
| מקור המדיניות והמוצרים | חומרי הקורס ב-`docs/course/` | 12 קבצי מדיניות ו-34 מוצרים מוכנים. לא ממציאים תוכן. |
| MCP ל-n8n | ה-MCP המובנה של n8n (Settings → Instance-level MCP) | הקורס מלמד אותו (שיעור 25). חלופה לצד שלישי. |

## 3. ארכיטקטורה

```
טריגרים                       ליבה                          שירותים
בוט טלגרם מנהל   ─┐                                     ┌─ Airtable (נתונים)
בוט טלגרם לקוחות ─┤    n8n (Docker) + סוכני AI          ├─ Gmail (מיילי מכירות)
Gmail נכנס       ─┼──► Supabase pgvector (RAG)     ────►├─ Google Drive (PDF)
לוחות זמנים      ─┤    Gotenberg (HTML→PDF)             └─ Telegram (התראות שגיאה)
אפליקציה (WF13)  ─┘
                        ▲ webhook (כתיבה, צ'אט)
                        │
Next.js על Vercel ──────┘
        │ קריאה ישירה (server only)
        ▼
    Airtable REST
```

האפליקציה קוראת נתונים ישירות מ-Airtable בצד השרת (PAT במשתני סביבה, לעולם לא בדפדפן). כל כתיבה וכל פעולה חכמה עוברות דרך webhook יחיד ב-n8n (WF13), כך שכללי העסק נאכפים במקום אחד.

## 4. מבנה הריפוזיטורי

```
פרויקט גמר/
  app/                    Next.js
  n8n/
    docker-compose.yml    n8n + gotenberg
    .env.example
    workflows/            JSON מיוצא של כל workflow (מקור האמת להגשה)
  airtable/
    schema.md             טבלאות ושדות, שמות מדויקים
  docs/
    superpowers/specs/    מסמך זה
    course/               חומרי הקורס: policies/ (12 md), products/products.csv, workflows/ (4 json), מסמכים
    runbook.md            הקמה מאפס, צעד אחר צעד
    demo.md               סקריפט דמו מקצה לקצה
```

הריפוזיטורי הוא תיעוד והגשה. ה-workflows חיים ב-n8n ומיוצאים ל-`n8n/workflows/` אחרי כל שינוי משמעותי.

## 5. נתונים — Airtable

בסיס אחד, חמש טבלאות. שמות שדות באנגלית, זהים בדיוק לטבלה שלמטה. כל `Status` הוא Single line text ולא Single select. כל `Created` הוא Created time.

| טבלה | שדות |
|---|---|
| Invoices | InvoiceNumber, CustomerId, Amount, VatAmount, Total, Status, PdfUrl, Created |
| Leads | Name, Email, Company, Status, Created |
| Products | Name, Category, Price, Description, InStock |
| Tasks | Title, Status |
| Customers | CustomerId, Name, Email, Phone |

ערכי Status:
- Invoices: `new` → `validated` → `generated` (או `error`).
- Leads: `new` → `contacted` → `replied` (או `duplicate`).
- Tasks: `open`, `done`.

קשרים בין טבלאות הם מפתחות זרים כטקסט (`CUST-0001`), לא Linked records.

חוקי מס: מע"מ 18% (17% לפני 01/01/2025), מספור רץ `INV-0001`. מגבלה ידועה: התנגשות מספור אם שתי חשבוניות נוצרות באותה דקה. מקובל.

## 6. n8n — תהליכים

תשעת התהליכים של המסמך, בשמות ובמספור שלו, ועוד שניים.

| # | שם | טריגר | תפקיד |
|---|---|---|---|
| WF1 | אימות מסמכי מס | Airtable Trigger על Invoices (Created) | מחשב VatAmount ו-Total ב-Edit Fields, בודק Amount > 0 ו-CustomerId קיים ב-IF, מעדכן Status ל-`validated` או `error`. |
| WF2 | קליטת לידים וסינון כפילויות | Airtable Trigger על Leads (Created) | מחפש Email זהה, Summarize סופר, IF מסמן `duplicate` או משאיר `new`. |
| WF3 | סוכן מכירות — מיילים קרים | Schedule כל 3 שעות | שולף ליד אחד עם Status `new`, סוכן מנסח מייל בעברית, Gmail שולח, Status ל-`contacted`. ליד אחד בכל הרצה. |
| WF4 | סוכן מכירות — תשובות | Gmail Trigger כל 30 דקות | מזהה תשובה לפי כתובת השולח, מעדכן Status ל-`replied`. |
| WF5 | סוכן שירות לקוחות | Telegram Trigger (בוט לקוחות) | AI Agent עם Supabase Vector Store כ-tool, עונה בעברית לפי מדיניות וקטלוג בלבד. |
| WF6 | מדיניות → מאגר וקטורי | ידני | טקסט `docs/policy.md` ב-Edit Fields, Text Splitter, OpenAI Embeddings, Supabase Vector Store insert. |
| WF7 | מוצרים → מאגר וקטורי | ידני | Airtable Products → טקסט לכל מוצר → Embeddings → Supabase insert. |
| WF8 | הפקת PDF חשבונית | Schedule כל דקה | Invoices עם Status `validated`, Customers לשם הלקוח, בניית HTML RTL, HTTP Request ל-Gotenberg, Google Drive upload, עדכון PdfUrl ו-Status `generated`. |
| WF9 | סוכן המנהל | Telegram Trigger (בוט מנהל) | IF על Chat ID של הבעלים. Summarize + Aggregate על Invoices (סה"כ, ספירה, לא שולם), הסוכן מנסח בעברית. |
| WF13 | API לאפליקציה | Webhook POST | בודק header secret. Switch לפי `action`: `create` כותב ל-Airtable לפי `table`; `chat` מעביר לסוכן המנהל; מחזיר JSON. |
| WF-Error | התראות שגיאה | Error Trigger | שולח לטלגרם של המנהל: שם workflow, צומת, הודעה. מוגדר כ-Error Workflow בכל התהליכים. |

חוזה WF13:

```json
POST /webhook/erp
Headers: x-erp-secret: <secret>
Body: { "action": "create" | "chat", "table"?: "Invoices"|"Leads"|"Products"|"Tasks"|"Customers", "payload"?: {...}, "message"?: "..." }
Response: { "ok": true, "record"?: {...}, "reply"?: "..." } | { "ok": false, "error": "..." }
```

הנחיות הסוכנים (System Message) יושבות בצומת הסוכן ב-n8n ומועתקות גם ל-`docs/` לתיעוד.

## 7. אפליקציית הניהול — Next.js

### מסכים
- דשבורד: הכנסות החודש, חשבוניות פתוחות, לידים לפי סטטוס, משימות פתוחות.
- חשבוניות: טבלה עם חיפוש וסינון לפי סטטוס, קישור PdfUrl, טופס יצירה (CustomerId, Amount).
- לידים: טבלה וטופס.
- לקוחות: טבלה וטופס.
- מוצרים: טבלה וטופס.
- משימות: רשימה, סימון done.
- צ'אט: פאנל ששולח `{ action: "chat", message }` ל-WF13 ומציג `reply`.

### נתונים
- קריאה: Server Components קוראים מ-Airtable REST עם `AIRTABLE_PAT` ו-`AIRTABLE_BASE_ID` ממשתני סביבה. אין client-side fetch ל-Airtable.
- כתיבה: Server Actions שולחים POST ל-`N8N_WEBHOOK_URL` עם `N8N_WEBHOOK_SECRET`. אחרי הצלחה `revalidatePath`.
- אין מסד נתונים באפליקציה. אין ORM. אין cache מעבר לברירת המחדל של Next.js.

### אבטחה
משתמש יחיד. `middleware` בודק cookie חתום; דף login עם סיסמה אחת מ-`APP_PASSWORD`. סודות רק ב-Vercel env. PAT לא מגיע לדפדפן.

### עיצוב
עברית, `dir="rtl"`, גופן עברי (Heebo או Assistant), מטבע ₪, תאריכים dd/mm/yyyy. shadcn/ui לטבלאות, טפסים ודיאלוגים. עיצוב לפי skill של interface-design, בדיקה עם rtl-qa.

## 8. RAG

1. הכנה: WF6 (מדיניות) ו-WF7 (מוצרים) מריצים ידנית. Embeddings של OpenAI (`text-embedding-3-small`), טבלת `documents` ב-Supabase עם עמודת vector ופונקציית `match_documents` לפי התבנית של n8n.
2. שליפה: WF5 משתמש בצומת Supabase Vector Store במצב retrieve-as-tool.
3. תשובה: System Message מורה לסוכן לענות רק מתוך הקטעים שנמצאו, ולהגיד "אין לי מידע על זה" אחרת.

תוכן המדיניות: 12 קבצי Markdown שהקורס מספק ב-`docs/course/policies/` (סקירת העסק, החזרות, אחריות, משלוחים, תמחור, תשלומים וחשבוניות, חוקי חשבונית מס בישראל, guardrails לסוכנים, טון שירות, playbook מכירות, brief לסוכן המנהל, FAQ). העסק הוא **איי.איי אלקטרוניקה (AI Electronics)**. הקבצים האלה הם מקור האמת למדיניות ולהנחיות הסוכנים; לא כותבים מדיניות משלנו. WF6 טוען אותם כקבצים (כמו ב-workflow לדוגמה של הקורס, `docs/course/workflows/3-policies-embedding.json`) ומכניס ל-Supabase. שינוי במדיניות = עריכת הקובץ והרצה מחדש של WF6.

קטלוג המוצרים: `docs/course/products/products.csv` (34 מוצרים, 13 קטגוריות) נטען ל-Airtable Products בסקריפט `airtable/seed.sh`, ומשם WF7 מכניס ל-Supabase.

חומרי הקורס ב-`docs/course/` (תיקיית הדרייב של הקורס, שיעורים 24–26) כוללים גם 4 workflows לדוגמה ב-`docs/course/workflows/` — נקודת ייחוס לגרסאות node ולמבנה בתוכנית 2.

## 9. תשתית מקומית

`n8n/docker-compose.yml` עם שני שירותים:
- `n8n` עם volume קבוע, `WEBHOOK_URL` = כתובת ngrok, `N8N_ENCRYPTION_KEY` קבוע.
- `gotenberg` על פורט פנימי. n8n קורא לו בכתובת `http://gotenberg:3000/forms/chromium/convert/html`.

ngrok עם static domain חינמי: `ngrok http 5678 --domain=<domain>`. הכתובת קבועה, ולכן Telegram ו-Gmail webhooks לא נשברים.

## 10. טיפול בשגיאות

- כל workflow מפנה ל-WF-Error כ-Error Workflow. שגיאה = הודעת טלגרם למנהל ורשומה אדומה ב-Executions.
- WF13 מחזיר `{ ok: false, error }` עם קוד 400 על בקשה לא תקינה ו-401 על secret שגוי. האפליקציה מציגה toast עם השגיאה.
- WF1 מסמן חשבונית לא תקינה ב-Status `error` במקום להיכשל.
- אין retries אוטומטיים. מכוון, לפי המסמך.

## 11. בדיקות ואימות

- כל workflow נבדק ידנית עם רשומת בדיקה אחת ומתועד ב-`docs/runbook.md` עם התוצאה הצפויה.
- בדיקת קצה לקצה: יצירת חשבונית מהאפליקציה → WF1 מחשב מע"מ → WF8 מפיק PDF → הקישור מופיע באפליקציה. זה גם סקריפט הדמו.
- אפליקציה: Playwright smoke (login, דשבורד נטען, טופס חשבונית, PDF מופיע) דרך skill של webapp-testing. RTL ונייד עם agent של rtl-qa.
- בוטים: שאלה אחת לכל בוט, מתועדת ב-`docs/demo.md`.

## 12. מגבלות מקובלות

- המחשב חייב להיות דלוק בדמו (n8n מקומי). אם צריך, מייבאים את ה-JSON-ים ל-n8n Cloud לפני ההגשה.
- Google OAuth במצב Testing: refresh token פג אחרי 7 ימים. מאשרים מחדש לפני הדמו.
- מספור חשבוניות עלול להתנגש באותה דקה.
- משתמש יחיד באפליקציה, בלי הרשאות.
- Airtable מוגבל לכ-5 בקשות לשנייה.
- אין Orders, Suppliers, Expenses וכו'. 5 טבלאות בלבד.

## 13. אבני דרך

| שבוע | תוצר |
|---|---|
| 1 | חשבונות (Airtable, Supabase, Google, טלגרם, ngrok), Docker רץ, בסיס Airtable, credentials ב-n8n, WF1, WF13, WF9, שלד Next.js עם login, דשבורד וחשבוניות. |
| 2 | WF2, WF5–WF7 עם pgvector, WF3–WF4, WF8 עם Gotenberg ו-Drive. שאר המסכים, טפסים, צ'אט. |
| 3 | WF-Error, ליטוש עיצוב, RTL QA, Playwright smoke, ייצוא JSON-ים, runbook, demo. |
| 4 | באפר ותיקונים. |

## 14. מה לא בונים

- לא 14 טבלאות. לא דוחות תקופתיים, לא תזכורות, לא סנכרון מוצרים.
- לא מערכת auth מרובת משתמשים.
- לא מסד נתונים באפליקציה.
- לא Lovable ולא Base44.
- לא retries ולא queue.
