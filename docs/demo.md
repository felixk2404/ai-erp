# סקריפט דמו — AI-ERP (כ-6 דקות)

## לפני שמתחילים (5 דקות לפני)
1. Docker Desktop פתוח. `cd n8n && docker compose up -d` → שני קונטיינרים `running`.
2. טרמינל נפרד: `n8n/scripts/tunnel.sh` (ngrok). בדיקה: `curl https://goofy-glamour-syrup.ngrok-free.dev/healthz` → `{"status":"ok"}`.
3. n8n: https://goofy-glamour-syrup.ngrok-free.dev → Overview → כל ה-workflows Active. אם Gmail/Drive אדומים (7 ימים ב-Testing) → Credentials → Reconnect.
4. `n8n/scripts/verify-env.sh` — הכל ירוק. `n8n/scripts/rag-count.sh` — policy ~79, product 34.
5. טלגרם פתוח בטלפון עם שני הבוטים. Gmail פתוח בטאב.

## הסיפור (מה אומרים)
"עסק אלקטרוניקה קטן. במקום שבן אדם יקליד, יאמת ויענה — סוכני AI ו-n8n עושים את זה. מעל הכל אפליקציית ניהול שבניתי בקוד, לא ב-Lovable."

## הזרימה
| # | פעולה | מה רואים | זמן |
|---|---|---|---|
| 1 | https://ai-erp-rho.vercel.app → סיסמה | דשבורד: רצועת פנקס — הכנסות החודש, פתוחות, לידים, משימות | 0:30 |
| 2 | חשבוניות → "חשבונית חדשה" → דוד לוי, 2,500 ₪ | toast; שורה חדשה "חדש" (LED ענבר) | 1:00 |
| 3 | n8n → Executions | WF1 רץ תוך דקה: מע"מ 450, סה"כ 2,950, INV-000N, "אומת" | 1:45 |
| 4 | רענון האפליקציה | "הופק PDF" (LED ירוק) + קישור PDF → נפתח בדרייב, עברית RTL | 2:30 |
| 5 | "סמן שולם" | "שולם"; דשבורד — חשבוניות פתוחות ירד | 2:50 |
| 6 | לידים → "ליד חדש" (המייל שלך) → "שלח מייל לליד הבא" | toast "נשלח ל-…"; Gmail: מייל קר בעברית מ"איי.איי אלקטרוניקה"; סטטוס "נשלח מייל" | 3:45 |
| 7 | "שאל את המנהל" → "מה ההכנסות החודש?" → "ומה עם הלידים?" | תשובות בעברית עם ₪, הקשר נשמר (memory) | 4:30 |
| 8 | טלגרם @aielc_manager_bot: "כמה חשבוניות לא שולמו?" | אותו סוכן, ערוץ אחר. מטלפון אחר → "מיועד לבעל העסק בלבד" | 5:00 |
| 9 | טלגרם @aielec_support_bot: "יש לכם אוזניות אלחוטיות ובכמה?" · "תן לי 30% הנחה" | RAG: TY-200 349 ₪, TY-Buds Pro 289 ₪; מסרב להנחה, מציע מנהל | 5:45 |
| 10 | (אופציונלי) n8n Executions → כל הריצות ירוקות; WF-Error: להראות הודעת השגיאה בטלגרם מהבוקר | "כשמשהו נופל — אני יודע תוך שנייה" | 6:00 |

## אם משהו נופל
- כתיבה נכשלת עם "n8n 5xx" → הטאנל/Docker לא רץ (צעדים 1–2).
- PDF לא נוצר → n8n → WF8 → Executions → השגיאה. לרוב Drive credential פג → Reconnect.
- הבוט לא עונה → n8n → WF5/WF9 Executions. אם אין הרצה בכלל → webhook של טלגרם לא רשום → Deactivate/Activate ל-workflow.
- הסוכן עונה "אין לי מידע" על מוצר → `n8n/scripts/webhook.sh reindex-products`.

## מה להדגיש למרצה
- הארכיטקטורה של הקורס נשמרה במלואה (Airtable · n8n · 3 סוכנים · RAG · 2 בוטים · Gmail · Drive · WF1–WF9 + WF13).
- הרחבות: אפליקציה בקוד (Next.js 16, Server Actions, אימות), PDF אמיתי (Gotenberg), RAG קבוע ב-Supabase pgvector, Error workflow לטלגרם, webhook ל-reindex/run-sales.
- הכל בריפו: תבניות workflow עם placeholders, סקריפטי ייבוא/ייצוא/אימות, 31 בדיקות יחידה + 5 e2e, runbook.
