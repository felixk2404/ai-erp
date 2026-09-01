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

תיקיית Drive לחשבוניות: `AI-ERP Invoices`, ID: `<להשלים>`
