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

## 6. מלכודות שנתקלנו בהן
- הוק secret-guard חוסם כל פקודה עם `.env`; הסקריפטים טוענים דרך `scripts/load-env.sh`.
- TextEdit מכניס תווי כיווניות נסתרים וגרשיים חכמים — load-env מנקה.
- סיסמת DB עם `#`/`$` — load-env מקודד אוטומטית; מרכאות בודדות סביב הערך ב-.env.
- Airtable Metadata API לא יוצר שדה Created time — מוסיפים ידנית, הסקריפט משנה שם ל-`Created`.
- Gotenberg: Chromium איטי בהפעלה ראשונה — timeout 90s ב-compose.
