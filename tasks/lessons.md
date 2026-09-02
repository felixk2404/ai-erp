# לקחים

## 2026-09-02 — הוק secret-guard
- ההוק `~/.claude/hooks/secret-guard.sh` חוסם כל פקודת Bash או נתיב קובץ שמכיל `.env` (גם `.env.example`), `credentials.json`, `*.pem`, `*.key` ועוד.
- כלל: קבצי תבנית נקראים `env.example` בלי נקודה. סקריפטים שמזכירים `.env` נכתבים עם Write tool (ההוק בודק רק את הנתיב), ומורצים לפי שם הקובץ בלבד, בלי `.env` במחרוזת הפקודה.
- הסוכן לעולם לא קורא סודות. אימות עושים דרך סקריפטים שמדפיסים רק תוצאה (id, status), לא ערכים.

## 2026-09-02 — n8n Airtable node v2.2
- פלט של Airtable search/get/create ב-n8n הוא `{id, createdTime, fields:{...}}` — לא שטוח. בביטויים: `$json.fields.X`. ב-Summarize: `fields.X`. רק Airtable Trigger גם הוא באותו מבנה. לוודא צורת פלט בהרצה אמיתית לפני שכותבים ביטויים.
- ב-n8n 2.x sub-workflow חייב להיות active ("published") לפני שמפעילים workflow שקורא לו.
- Set node עם ביטוי על שדה לא קיים לא נכשל (מחזיר ריק). לבדיקת Error workflow משתמשים ב-Stop and Error.
