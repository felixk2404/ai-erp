# AI-ERP — תוכנית 1: תשתית ונתונים

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** n8n ו-Gotenberg רצים ב-Docker עם כתובת ציבורית קבועה, בסיס Airtable עם חמש טבלאות מדויקות, Supabase עם pgvector, וכל ה-credentials מחוברים ב-n8n. בסוף התוכנית אפשר לבנות כל workflow מהספק בלי לפתוח עוד חשבון.

**Architecture:** הכל בענן חוץ מ-n8n שרץ מקומית ב-Docker ונחשף דרך ngrok static domain. סודות ב-`n8n/.env` (gitignored), דוגמה ב-`n8n/.env.example`. סכימת Airtable נוצרת בסקריפט דרך Metadata API כדי ששמות השדות יהיו זהים לספק. credentials של n8n נוצרים בסקריפט דרך n8n Public API, חוץ מ-Google OAuth שנעשה ב-UI.

**Tech Stack:** Docker Desktop, n8n (image `docker.n8n.io/n8nio/n8n`), Gotenberg 8, ngrok, Airtable Metadata API, Supabase (Postgres + pgvector), bash + curl + jq.

**Spec:** `docs/superpowers/specs/2026-09-02-ai-erp-design.md`

## Global Constraints

- שמות שדות ב-Airtable זהים בדיוק לספק סעיף 5. `Status` הוא Single line text. `Created` הוא Created time.
- חמש טבלאות בלבד: Invoices, Leads, Products, Tasks, Customers.
- Embeddings: `text-embedding-3-small`, וקטור 1536.
- אזור זמן: `Asia/Jerusalem`.
- סודות לעולם לא נכנסים ל-git. `n8n/.env` ב-`.gitignore` (כבר קיים).
- כל קובץ תיעוד בעברית, נורמלית ומלאה.
- משימות ידניות (פתיחת חשבונות, OAuth) מסומנות **[ידני]** ומסתיימות בפקודת אימות.

---

## מבנה קבצים

| קובץ | אחריות |
|---|---|
| `n8n/docker-compose.yml` | שני שירותים: n8n עם volume, gotenberg |
| `n8n/.env.example` | כל המשתנים עם ערכי דוגמה |
| `n8n/.env` | הערכים האמיתיים, gitignored |
| `n8n/scripts/test-gotenberg.sh` | HTML עברי → PDF, בדיקת גופן |
| `n8n/scripts/create-credentials.sh` | יוצר credentials ב-n8n דרך Public API |
| `n8n/supabase.sql` | pgvector, טבלת documents, match_documents |
| `airtable/schema.md` | הסכימה בעברית לקריאה |
| `airtable/create-tables.sh` | יוצר את חמש הטבלאות דרך Metadata API |
| `airtable/verify-schema.sh` | משווה את הסכימה בפועל לרשימה הצפויה |
| `docs/policy.md` | מדיניות העסק, מוזן ל-WF6 |
| `docs/runbook.md` | הקמה מאפס, מתעדכן בכל משימה |
| `tasks/todo.md` | מעקב ברמת תוכניות |

---

### Task 1: חשבונות ומשתני סביבה [ידני]

**Files:**
- Create: `n8n/.env.example`
- Create: `n8n/.env`
- Create: `docs/runbook.md`
- Create: `tasks/todo.md`

**Interfaces:**
- Produces: `n8n/.env` עם המשתנים `N8N_ENCRYPTION_KEY`, `NGROK_DOMAIN`, `NGROK_AUTHTOKEN`, `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `OPENAI_API_KEY`, `TELEGRAM_MANAGER_TOKEN`, `TELEGRAM_CUSTOMER_TOKEN`, `OWNER_CHAT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_DB_URL`, `N8N_API_KEY` (ממולא בTask 7), `N8N_WEBHOOK_SECRET`. כל התוכניות הבאות קוראות ממנו.

- [ ] **Step 1: כתיבת `.env.example`**

```bash
mkdir -p n8n && cat > n8n/.env.example <<'EOF'
# n8n
N8N_ENCRYPTION_KEY=change-me-32-random-chars
N8N_API_KEY=                       # נוצר ב-n8n UI, Task 7
N8N_WEBHOOK_SECRET=change-me-random # header x-erp-secret ל-WF13

# ngrok (https://dashboard.ngrok.com)
NGROK_AUTHTOKEN=
NGROK_DOMAIN=your-name.ngrok-free.app

# Airtable (https://airtable.com/create/tokens)
AIRTABLE_PAT=pat...
AIRTABLE_BASE_ID=app...            # ממולא ב-Task 4

# OpenAI
OPENAI_API_KEY=sk-...

# Telegram (BotFather)
TELEGRAM_MANAGER_TOKEN=
TELEGRAM_CUSTOMER_TOKEN=
OWNER_CHAT_ID=

# Supabase (Project Settings -> API / Database)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=
SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
EOF
cp n8n/.env.example n8n/.env
```

- [ ] **Step 2: יצירת מפתחות אקראיים**

```bash
cd n8n
sed -i '' "s|^N8N_ENCRYPTION_KEY=.*|N8N_ENCRYPTION_KEY=$(openssl rand -hex 16)|" .env
sed -i '' "s|^N8N_WEBHOOK_SECRET=.*|N8N_WEBHOOK_SECRET=$(openssl rand -hex 16)|" .env
grep -E '^(N8N_ENCRYPTION_KEY|N8N_WEBHOOK_SECRET)=' .env
```
Expected: שתי שורות עם 32 תווים הקסדצימליים.

- [ ] **Step 3: פתיחת חשבונות ומילוי `.env`** — הסטודנט עושה בדפדפן:

1. **ngrok**: הרשמה ב-dashboard.ngrok.com. Domains → New Domain → יוצרים static domain חינמי (למשל `felix-erp.ngrok-free.app`). Your Authtoken → מעתיקים. ממלאים `NGROK_AUTHTOKEN`, `NGROK_DOMAIN`.
2. **Airtable**: הרשמה. Account → Developer hub → Personal access tokens → Create token. Scopes: `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`. Access: All current and future bases in all workspaces. ממלאים `AIRTABLE_PAT`. את `AIRTABLE_BASE_ID` ממלאים ב-Task 4.
3. **OpenAI**: ממלאים `OPENAI_API_KEY` מהמפתח הקיים.
4. **Telegram**: בטלגרם פותחים @BotFather, `/newbot` פעמיים: "ERP Manager" ו-"ERP Customer Service". ממלאים `TELEGRAM_MANAGER_TOKEN`, `TELEGRAM_CUSTOMER_TOKEN`. שולחים הודעה "היי" לבוט המנהל מהחשבון האישי (נצרך ב-Step 4).
5. **Supabase**: הרשמה ב-supabase.com, New project, שם `ai-erp`, region `eu-central-1`, שומרים את סיסמת ה-DB. Project Settings → API: מעתיקים Project URL ל-`SUPABASE_URL`, `service_role` key ל-`SUPABASE_SERVICE_KEY`. Project Settings → Database → Connection string → URI (Session pooler) ל-`SUPABASE_DB_URL` עם הסיסמה.
6. **Google Cloud**: פותחים פרויקט ב-console.cloud.google.com בשם `ai-erp`. APIs & Services → Enable: Gmail API, Google Drive API. OAuth consent screen: External, Testing, מוסיפים את המייל של הסטודנט כ-Test user. Credentials → Create OAuth client → Web application. Redirect URI מוסיפים ב-Task 8. ב-Google Drive יוצרים תיקייה `AI-ERP Invoices` ומעתיקים את ה-ID מה-URL (`folders/<ID>`) ל-`docs/runbook.md`.

- [ ] **Step 4: Chat ID של הבעלים**

```bash
cd n8n && set -a && source .env && set +a
curl -s "https://api.telegram.org/bot$TELEGRAM_MANAGER_TOKEN/getUpdates" | jq '.result[-1].message.chat.id'
```
Expected: מספר (למשל `123456789`). ממלאים ב-`OWNER_CHAT_ID`. אם `null`: שולחים שוב הודעה לבוט ומריצים שוב.

- [ ] **Step 5: אימות כל הטוקנים**

```bash
cd n8n && set -a && source .env && set +a
echo "telegram manager:  $(curl -s https://api.telegram.org/bot$TELEGRAM_MANAGER_TOKEN/getMe | jq -r .result.username)"
echo "telegram customer: $(curl -s https://api.telegram.org/bot$TELEGRAM_CUSTOMER_TOKEN/getMe | jq -r .result.username)"
echo "airtable:          $(curl -s -H "Authorization: Bearer $AIRTABLE_PAT" https://api.airtable.com/v0/meta/whoami | jq -r .id)"
echo "openai:            $(curl -s -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models | jq -r '.data[0].object')"
echo "supabase:          $(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $SUPABASE_SERVICE_KEY" $SUPABASE_URL/rest/v1/)"
```
Expected: שני שמות בוט, `usr...`, `model`, `200`.

- [ ] **Step 6: runbook ו-todo ראשוניים**

```bash
mkdir -p docs tasks
cat > docs/runbook.md <<'EOF'
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

תיקיית Drive לחשבוניות: `AI-ERP Invoices`, ID: `<להשלים>`

אימות: `n8n/scripts` ו-Step 5 בתוכנית 1.
EOF
cat > tasks/todo.md <<'EOF'
# AI-ERP — מעקב

- [ ] תוכנית 1: תשתית ונתונים — docs/superpowers/plans/2026-09-02-01-infrastructure.md
- [ ] תוכנית 2: n8n workflows
- [ ] תוכנית 3: אפליקציית Next.js
EOF
```

- [ ] **Step 7: Commit**

```bash
git add n8n/.env.example docs/runbook.md tasks/todo.md
git commit -m "chore: env template, runbook and todo"
```

---

### Task 2: Docker — n8n + Gotenberg

**Files:**
- Create: `n8n/docker-compose.yml`
- Create: `n8n/scripts/test-gotenberg.sh`

**Interfaces:**
- Produces: n8n ב-`http://localhost:5678`, Gotenberg בשם `gotenberg` ברשת של compose (`http://gotenberg:3000`), ומהמק ב-`http://localhost:3001`. תוכנית 2 משתמשת ב-`http://gotenberg:3000/forms/chromium/convert/html`.

- [ ] **Step 1: כתיבת docker-compose**

```yaml
# n8n/docker-compose.yml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - N8N_HOST=${NGROK_DOMAIN}
      - N8N_PROTOCOL=https
      - N8N_PORT=5678
      - WEBHOOK_URL=https://${NGROK_DOMAIN}/
      - N8N_EDITOR_BASE_URL=https://${NGROK_DOMAIN}/
      - N8N_SECURE_COOKIE=false
      - GENERIC_TIMEZONE=Asia/Jerusalem
      - TZ=Asia/Jerusalem
      - N8N_RUNNERS_ENABLED=true
      - N8N_DEFAULT_BINARY_DATA_MODE=filesystem
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - gotenberg
    restart: unless-stopped

  gotenberg:
    image: gotenberg/gotenberg:8
    ports:
      - "3001:3000"
    restart: unless-stopped

volumes:
  n8n_data:
```

- [ ] **Step 2: הרצה**

```bash
cd n8n && docker compose up -d && sleep 20 && docker compose ps
curl -s http://localhost:5678/healthz
curl -s http://localhost:3001/health | jq .status
```
Expected: שני קונטיינרים `running`, `{"status":"ok"}`, `"up"`.

- [ ] **Step 3: בדיקת Gotenberg עם עברית**

```bash
mkdir -p n8n/scripts && cat > n8n/scripts/test-gotenberg.sh <<'EOF'
#!/usr/bin/env bash
# ממיר HTML עברי ל-PDF דרך Gotenberg ומוודא שהטקסט נשמר.
set -euo pipefail
TMP=$(mktemp -d)
cat > "$TMP/index.html" <<'HTML'
<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap" rel="stylesheet">
<style>body{font-family:Heebo,sans-serif;padding:40px}h1{color:#0f766e}</style></head>
<body><h1>חשבונית מס INV-0001</h1><p>סה"כ לתשלום: 1,180.00 ₪</p></body></html>
HTML
curl -s -o "$TMP/out.pdf" -F "files=@$TMP/index.html" \
  -F "waitDelay=1s" http://localhost:3001/forms/chromium/convert/html
SIZE=$(stat -f%z "$TMP/out.pdf")
echo "pdf bytes: $SIZE"
[ "$SIZE" -gt 5000 ] || { echo "PDF too small"; exit 1; }
if command -v pdftotext >/dev/null; then pdftotext "$TMP/out.pdf" - | head -3; fi
open "$TMP/out.pdf"
EOF
chmod +x n8n/scripts/test-gotenberg.sh && n8n/scripts/test-gotenberg.sh
```
Expected: `pdf bytes:` מעל 5000, ה-PDF נפתח ומציג כותרת בעברית מימין לשמאל בגופן Heebo. אם האותיות ריבועים: הגופן לא נטען, בודקים שיש אינטרנט לקונטיינר.

- [ ] **Step 4: יצירת משתמש owner ב-n8n [ידני]**

פותחים `http://localhost:5678`, ממלאים את טופס ה-owner (מייל + סיסמה), שומרים את הסיסמה במנהל סיסמאות. מדלגים על השאלון.

- [ ] **Step 5: Commit**

```bash
git add n8n/docker-compose.yml n8n/scripts/test-gotenberg.sh
git commit -m "feat(infra): n8n + gotenberg docker compose with hebrew pdf smoke test"
```

---

### Task 3: ngrok — כתובת ציבורית קבועה

**Files:**
- Create: `n8n/scripts/tunnel.sh`
- Modify: `docs/runbook.md`

**Interfaces:**
- Produces: `https://${NGROK_DOMAIN}` מגיע ל-n8n. Telegram/Gmail triggers ו-WF13 משתמשים בכתובת הזו.

- [ ] **Step 1: התקנת ngrok**

```bash
brew install ngrok
cd n8n && set -a && source .env && set +a
ngrok config add-authtoken "$NGROK_AUTHTOKEN"
```

- [ ] **Step 2: סקריפט טאנל**

```bash
cat > n8n/scripts/tunnel.sh <<'EOF'
#!/usr/bin/env bash
# מרים טאנל ngrok לכתובת הקבועה. להשאיר רץ בטרמינל נפרד.
set -euo pipefail
cd "$(dirname "$0")/.." && set -a && source .env && set +a
exec ngrok http 5678 --domain="$NGROK_DOMAIN"
EOF
chmod +x n8n/scripts/tunnel.sh
n8n/scripts/tunnel.sh &
sleep 5
```

- [ ] **Step 3: אימות**

```bash
cd n8n && set -a && source .env && set +a
curl -s "https://$NGROK_DOMAIN/healthz"
```
Expected: `{"status":"ok"}`. פותחים `https://$NGROK_DOMAIN` בדפדפן: מסך login של n8n.

- [ ] **Step 4: תיעוד ב-runbook**

```bash
cat >> docs/runbook.md <<'EOF'

## 2. הרצה יומית
```bash
cd n8n && docker compose up -d      # n8n + gotenberg
n8n/scripts/tunnel.sh               # טרמינל נפרד, משאירים פתוח
```
n8n מקומי: http://localhost:5678 · ציבורי: https://<NGROK_DOMAIN>
לפני הדמו: לוודא שהטאנל רץ, ושה-Google OAuth לא פג (7 ימים במצב Testing).
EOF
```

- [ ] **Step 5: Commit**

```bash
git add n8n/scripts/tunnel.sh docs/runbook.md
git commit -m "feat(infra): ngrok static tunnel script"
```

---

### Task 4: Airtable — בסיס וחמש טבלאות

**Files:**
- Create: `airtable/schema.md`
- Create: `airtable/create-tables.sh`
- Create: `airtable/verify-schema.sh`

**Interfaces:**
- Produces: `AIRTABLE_BASE_ID` ב-`n8n/.env`. טבלאות `Invoices`, `Leads`, `Products`, `Tasks`, `Customers` עם השדות מהספק. תוכנית 2 ו-3 מסתמכות על השמות האלה בדיוק.

- [ ] **Step 1: יצירת בסיס ריק [ידני]**

ב-Airtable: Create → Start from scratch → שם `AI-ERP`. ה-URL הוא `https://airtable.com/appXXXXXXXXXXXXXX/...`. מעתיקים את `appXXXXXXXXXXXXXX` ל-`AIRTABLE_BASE_ID` ב-`n8n/.env`. הבסיס נוצר עם "Table 1" — מוחקים אותה אחרי Step 3.

- [ ] **Step 2: schema.md**

```bash
mkdir -p airtable && cat > airtable/schema.md <<'EOF'
# סכימת Airtable — AI-ERP

בסיס אחד, חמש טבלאות. שמות השדות באנגלית וזהים בדיוק לטבלה. כל `Status` הוא Single line text (לא Single select). כל `Created` הוא Created time. מפתחות זרים כטקסט.

| טבלה | שדה | סוג | הערות |
|---|---|---|---|
| Invoices | InvoiceNumber | Single line text | ראשי. `INV-0001` |
| Invoices | CustomerId | Single line text | `CUST-0001` |
| Invoices | Amount | Number (2) | לפני מע"מ |
| Invoices | VatAmount | Number (2) | מחושב ב-WF1 |
| Invoices | Total | Number (2) | מחושב ב-WF1 |
| Invoices | Status | Single line text | new / validated / generated / error |
| Invoices | PdfUrl | URL | מתמלא ב-WF8 |
| Invoices | Created | Created time | טריגר WF1 |
| Leads | Name | Single line text | ראשי |
| Leads | Email | Email | |
| Leads | Company | Single line text | |
| Leads | Status | Single line text | new / contacted / replied / duplicate |
| Leads | Created | Created time | טריגר WF2 |
| Products | Name | Single line text | ראשי |
| Products | Category | Single line text | |
| Products | Price | Number (2) | |
| Products | Description | Long text | מוזן ל-RAG ב-WF7 |
| Products | InStock | Checkbox | |
| Tasks | Title | Single line text | ראשי |
| Tasks | Status | Single line text | open / done |
| Customers | CustomerId | Single line text | ראשי. `CUST-0001` |
| Customers | Name | Single line text | |
| Customers | Email | Email | |
| Customers | Phone | Phone number | |

יצירה: `airtable/create-tables.sh`. אימות: `airtable/verify-schema.sh`.
EOF
```

- [ ] **Step 3: סקריפט יצירת טבלאות**

```bash
cat > airtable/create-tables.sh <<'EOF'
#!/usr/bin/env bash
# יוצר את חמש הטבלאות דרך Airtable Metadata API. מריצים פעם אחת על בסיס ריק.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && set -a && source .env && set +a
API="https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables"
H=(-H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json")

text()     { printf '{"name":"%s","type":"singleLineText"}' "$1"; }
longtext() { printf '{"name":"%s","type":"multilineText"}' "$1"; }
num()      { printf '{"name":"%s","type":"number","options":{"precision":2}}' "$1"; }
email()    { printf '{"name":"%s","type":"email"}' "$1"; }
phone()    { printf '{"name":"%s","type":"phoneNumber"}' "$1"; }
url()      { printf '{"name":"%s","type":"url"}' "$1"; }
created()  { printf '{"name":"%s","type":"createdTime","options":{"result":{"type":"dateTime","options":{"dateFormat":{"name":"iso"},"timeFormat":{"name":"24hour"},"timeZone":"Asia/Jerusalem"}}}}' "$1"; }
checkbox() { printf '{"name":"%s","type":"checkbox","options":{"icon":"check","color":"greenBright"}}' "$1"; }

create() { # name, fields json array
  echo "creating $1"
  curl -s "${H[@]}" -X POST "$API" -d "{\"name\":\"$1\",\"fields\":[$2]}" | jq -r '.id // .error'
}

create Invoices  "$(text InvoiceNumber),$(text CustomerId),$(num Amount),$(num VatAmount),$(num Total),$(text Status),$(url PdfUrl),$(created Created)"
create Leads     "$(text Name),$(email Email),$(text Company),$(text Status),$(created Created)"
create Products  "$(text Name),$(text Category),$(num Price),$(longtext Description),$(checkbox InStock)"
create Tasks     "$(text Title),$(text Status)"
create Customers "$(text CustomerId),$(text Name),$(email Email),$(phone Phone)"
EOF
chmod +x airtable/create-tables.sh && airtable/create-tables.sh
```
Expected: חמש שורות `creating X` ואחרי כל אחת `tblXXXXXXXXXXXXXX`. אם מופיע `error`: קוראים את ההודעה, בדרך כלל scope חסר ל-PAT.

אחרי ההצלחה: מוחקים ידנית את "Table 1" ב-Airtable UI (חץ ליד שם הטבלה → Delete table).

- [ ] **Step 4: סקריפט אימות**

```bash
cat > airtable/verify-schema.sh <<'EOF'
#!/usr/bin/env bash
# משווה את הסכימה בפועל לרשימה הצפויה. נכשל אם שדה חסר או בסוג שגוי.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && set -a && source .env && set +a
ACTUAL=$(curl -s -H "Authorization: Bearer $AIRTABLE_PAT" \
  "https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables" \
  | jq -r '.tables[] | .name as $t | .fields[] | "\($t).\(.name):\(.type)"' | sort)
EXPECTED=$(sort <<'LIST'
Invoices.InvoiceNumber:singleLineText
Invoices.CustomerId:singleLineText
Invoices.Amount:number
Invoices.VatAmount:number
Invoices.Total:number
Invoices.Status:singleLineText
Invoices.PdfUrl:url
Invoices.Created:createdTime
Leads.Name:singleLineText
Leads.Email:email
Leads.Company:singleLineText
Leads.Status:singleLineText
Leads.Created:createdTime
Products.Name:singleLineText
Products.Category:singleLineText
Products.Price:number
Products.Description:multilineText
Products.InStock:checkbox
Tasks.Title:singleLineText
Tasks.Status:singleLineText
Customers.CustomerId:singleLineText
Customers.Name:singleLineText
Customers.Email:email
Customers.Phone:phoneNumber
LIST
)
if diff <(echo "$EXPECTED") <(echo "$ACTUAL"); then echo "schema OK"; else echo "schema MISMATCH"; exit 1; fi
EOF
chmod +x airtable/verify-schema.sh && airtable/verify-schema.sh
```
Expected: `schema OK`. אם "Table 1" עדיין קיימת יופיעו שורות נוספות ב-diff — מוחקים אותה ומריצים שוב.

- [ ] **Step 5: רשומות ראשונות לבדיקה**

```bash
cd n8n && set -a && source .env && set +a
curl -s -X POST -H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json" \
  "https://api.airtable.com/v0/$AIRTABLE_BASE_ID/Customers" \
  -d '{"records":[{"fields":{"CustomerId":"CUST-0001","Name":"דוד לוי","Email":"david@example.com","Phone":"050-1234567"}}]}' | jq -r '.records[0].id'
curl -s -X POST -H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json" \
  "https://api.airtable.com/v0/$AIRTABLE_BASE_ID/Products" \
  -d '{"records":[{"fields":{"Name":"אוזניות אלחוטיות SoundMax Pro","Category":"אודיו","Price":349.9,"Description":"אוזניות Bluetooth 5.3 עם ביטול רעשים אקטיבי, 30 שעות סוללה, עמידות למים IPX4. אחריות שנה.","InStock":true}},{"fields":{"Name":"מטען USB-C 65W","Category":"מטענים","Price":129,"Description":"מטען GaN קומפקטי, שני יציאות USB-C ואחת USB-A, טעינה מהירה למחשבים ניידים וטלפונים.","InStock":true}}]}' | jq -r '.records[].id'
```
Expected: שלושה מזהי `rec...`.

- [ ] **Step 6: Commit**

```bash
git add airtable/
git commit -m "feat(data): airtable schema, create and verify scripts"
```

---

### Task 5: Supabase — pgvector

**Files:**
- Create: `n8n/supabase.sql`

**Interfaces:**
- Produces: טבלה `documents(id, content, metadata, embedding vector(1536))` ופונקציה `match_documents(query_embedding, match_count, filter)`. צומת Supabase Vector Store ב-n8n (תוכנית 2, WF5–WF7) משתמש בשמות האלה כברירת מחדל.

- [ ] **Step 1: SQL**

```bash
cat > n8n/supabase.sql <<'EOF'
-- מאגר וקטורי ל-RAG. תואם לצומת Supabase Vector Store של n8n.
create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

create index if not exists documents_embedding_idx
  on documents using hnsw (embedding vector_cosine_ops);
EOF
```

- [ ] **Step 2: הרצה**

```bash
brew list libpq >/dev/null 2>&1 || brew install libpq
cd n8n && set -a && source .env && set +a
/opt/homebrew/opt/libpq/bin/psql "$SUPABASE_DB_URL" -f supabase.sql
```
Expected: `CREATE EXTENSION`, `CREATE TABLE`, `CREATE FUNCTION`, `CREATE INDEX`. חלופה בלי psql: מדביקים את הקובץ ב-Supabase → SQL Editor → Run.

- [ ] **Step 3: אימות**

```bash
cd n8n && set -a && source .env && set +a
/opt/homebrew/opt/libpq/bin/psql "$SUPABASE_DB_URL" -Atc \
  "select count(*) from documents; select proname from pg_proc where proname='match_documents';"
```
Expected: `0` ואז `match_documents`.

- [ ] **Step 4: Commit**

```bash
git add n8n/supabase.sql
git commit -m "feat(data): supabase pgvector schema for rag"
```

---

### Task 6: מדיניות העסק — policy.md

**Files:**
- Create: `docs/policy.md`

**Interfaces:**
- Produces: הטקסט שמודבק לצומת Edit Fields ב-WF6 (תוכנית 2). כל שינוי כאן מחייב הרצה מחדש של WF6.

- [ ] **Step 1: כתיבת המדיניות**

```bash
cat > docs/policy.md <<'EOF'
# מדיניות העסק — אלקטרו-פלוס

שם העסק: אלקטרו-פלוס. חנות אלקטרוניקה ישראלית לצרכן: אודיו, מטענים, אביזרי מחשב ובית חכם.

## שעות פעילות
ראשון עד חמישי 09:00–18:00. שישי 09:00–13:00. שבת וחגים סגור. שירות בטלגרם עונה גם מחוץ לשעות, אבל טיפול אנושי חוזר ביום העסקים הבא.

## משלוחים
משלוח לכל הארץ ב-29 ₪. משלוח חינם בקנייה מעל 299 ₪. זמן אספקה 2–5 ימי עסקים. איסוף עצמי מהחנות ללא עלות, תוך יום עסקים אחד מאישור ההזמנה.

## החזרות והחלפות
ניתן להחזיר מוצר תוך 14 יום מקבלתו, באריזה המקורית ובלי סימני שימוש, בהתאם לחוק הגנת הצרכן. ההחזר הכספי מבוצע לאמצעי התשלום המקורי תוך 7 ימי עסקים. דמי ביטול: 5% ממחיר המוצר או 100 ₪, הנמוך מביניהם. מוצרים שנפתחו ואינם פגומים: החלפה בלבד, לא החזר כספי. אוזניות in-ear שנפתחו אינן ניתנות להחזרה מטעמי היגיינה.

## אחריות
שנה אחריות יצרן על כל המוצרים, אלא אם צוין אחרת בעמוד המוצר. האחריות מכסה תקלות ייצור. אינה מכסה נזק פיזי, נזקי מים או שימוש לא סביר. לתביעת אחריות פונים לשירות עם מספר החשבונית.

## תשלומים ומחירים
כל המחירים בשקלים וכוללים מע"מ 18%. תשלום בכרטיס אשראי (עד 3 תשלומים ללא ריבית מעל 500 ₪), Bit, או העברה בנקאית. אין תשלום במזומן במשלוח.

## מסמכי מס
על כל עסקה מופקת חשבונית מס או חשבונית מס-קבלה. המסמך נשלח כקובץ PDF ומופיע גם במערכת הניהול. מספרי המסמכים רצים ואינם ניתנים לשינוי.

## סטטוסי הזמנה
חדשה: נקלטה ומחכה לאישור. מאושרת: שולמה ומוכנה להכנה. נשלחה: יצאה למשלוח. הושלמה: נמסרה ללקוח. בוטלה: לפי בקשת הלקוח או בעיית מלאי.

## גבולות לסוכן השירות
הסוכן עונה רק על סמך המדיניות הזו וקטלוג המוצרים. הוא לא מבטיח הנחות, לא משנה מחירים, לא מאשר החזרים בעצמו, ולא נותן ייעוץ משפטי. כשאין לו מידע הוא אומר "אין לי מידע על זה, אשמח להעביר לנציג אנושי" ומבקש שם ומספר טלפון.

## טון שיחה
עברית פשוטה וידידותית, גוף שני, בלי סלנג ובלי אימוג'י. תשובות קצרות של עד 4 משפטים. תמיד מסיימים בשאלה אם אפשר לעזור בעוד משהו.
EOF
```

- [ ] **Step 2: בדיקה**

```bash
wc -w docs/policy.md
grep -c '^## ' docs/policy.md
```
Expected: מעל 300 מילים, `9` כותרות משנה (כל תשעת הנושאים מהספק).

- [ ] **Step 3: Commit**

```bash
git add docs/policy.md
git commit -m "docs: business policy for customer service rag"
```

---

### Task 7: n8n API key ו-credentials בסקריפט

**Files:**
- Create: `n8n/scripts/create-credentials.sh`

**Interfaces:**
- Consumes: `n8n/.env` מ-Task 1, n8n רץ מ-Task 2.
- Produces: credentials ב-n8n בשמות `Airtable ERP`, `OpenAI ERP`, `Telegram Manager`, `Telegram Customer`, `Supabase ERP`, `ERP Webhook Secret`. תוכנית 2 מפנה לשמות האלה. `N8N_API_KEY` ב-`.env` — תוכנית 2 מייבאת workflows איתו.

- [ ] **Step 1: יצירת API key [ידני]**

ב-n8n: Settings → n8n API → Create an API key → שם `cli`, ללא תפוגה. מעתיקים ל-`N8N_API_KEY` ב-`n8n/.env`.

```bash
cd n8n && set -a && source .env && set +a
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" http://localhost:5678/api/v1/workflows | jq '.data | length'
```
Expected: `0`.

- [ ] **Step 2: סקריפט credentials**

```bash
cat > n8n/scripts/create-credentials.sh <<'EOF'
#!/usr/bin/env bash
# יוצר את ה-credentials הלא-OAuth ב-n8n דרך Public API. Google OAuth נעשה ב-UI.
set -euo pipefail
cd "$(dirname "$0")/.." && set -a && source .env && set +a
API="http://localhost:5678/api/v1/credentials"
H=(-H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json")

mk() { # name type data-json
  printf '%-22s ' "$1"
  curl -s "${H[@]}" -X POST "$API" -d "{\"name\":\"$1\",\"type\":\"$2\",\"data\":$3}" | jq -r '.id // .message'
}

mk "Airtable ERP"       airtableTokenApi  "{\"accessToken\":\"$AIRTABLE_PAT\"}"
mk "OpenAI ERP"         openAiApi         "{\"apiKey\":\"$OPENAI_API_KEY\"}"
mk "Telegram Manager"   telegramApi       "{\"accessToken\":\"$TELEGRAM_MANAGER_TOKEN\"}"
mk "Telegram Customer"  telegramApi       "{\"accessToken\":\"$TELEGRAM_CUSTOMER_TOKEN\"}"
mk "Supabase ERP"       supabaseApi       "{\"host\":\"$SUPABASE_URL\",\"serviceRole\":\"$SUPABASE_SERVICE_KEY\"}"
mk "ERP Webhook Secret" httpHeaderAuth    "{\"name\":\"x-erp-secret\",\"value\":\"$N8N_WEBHOOK_SECRET\"}"
EOF
chmod +x n8n/scripts/create-credentials.sh && n8n/scripts/create-credentials.sh
```
Expected: שש שורות, כל אחת עם מזהה. אם `message` מופיע עם שגיאת סכימה: בודקים את שמות השדות של הסוג ב-`GET /api/v1/credentials/schema/<type>`:

```bash
cd n8n && set -a && source .env && set +a
for t in airtableTokenApi openAiApi telegramApi supabaseApi httpHeaderAuth; do
  echo "== $t"; curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" "http://localhost:5678/api/v1/credentials/schema/$t" | jq -c '.properties | keys'
done
```

- [ ] **Step 3: אימות ב-UI**

פותחים `http://localhost:5678/home/credentials`. Expected: שש credentials. לוחצים על `Airtable ERP` → Test → ירוק. אותו דבר ל-`OpenAI ERP` ולשני הטלגרם.

- [ ] **Step 4: Commit**

```bash
git add n8n/scripts/create-credentials.sh
git commit -m "feat(infra): create n8n credentials from env via public api"
```

---

### Task 8: Google OAuth — Gmail ו-Drive [ידני]

**Files:**
- Modify: `docs/runbook.md`

**Interfaces:**
- Produces: credentials ב-n8n בשמות `Gmail ERP` ו-`Google Drive ERP`. תוכנית 2 (WF3, WF4, WF8) מפנה אליהם. Drive folder ID ב-runbook.

- [ ] **Step 1: Redirect URI**

ב-n8n (דרך הכתובת הציבורית `https://<NGROK_DOMAIN>`, לא localhost): Credentials → Add → `Gmail OAuth2 API`. מעתיקים את ה-"OAuth Redirect URL" שמוצג. Expected: `https://<NGROK_DOMAIN>/rest/oauth2-credential/callback`.

ב-Google Cloud → Credentials → OAuth client (מ-Task 1) → Authorized redirect URIs → מוסיפים את הכתובת → Save. מעתיקים Client ID ו-Client Secret.

- [ ] **Step 2: Gmail**

בחזרה ב-n8n: מדביקים Client ID ו-Secret, שם `Gmail ERP`, Sign in with Google → בוחרים את חשבון הפרויקט → "Google hasn't verified this app" → Continue → מאשרים הרשאות. Expected: "Account connected".

- [ ] **Step 3: Drive**

Credentials → Add → `Google Drive OAuth2 API`, אותו Client ID ו-Secret, שם `Google Drive ERP`, Sign in with Google. Expected: "Account connected".

- [ ] **Step 4: אימות עם workflow חד-פעמי**

ב-n8n: New workflow → צומת Google Drive → credential `Google Drive ERP` → Resource: File/Folder → Operation: Search → Query: `AI-ERP Invoices` → Execute step. Expected: פריט אחד עם `id` של התיקייה. מעתיקים את ה-ID ל-`docs/runbook.md` במקום `<להשלים>`. מוחקים את ה-workflow.

- [ ] **Step 5: תיעוד ו-Commit**

```bash
cat >> docs/runbook.md <<'EOF'

## 3. Google OAuth
OAuth client במצב Testing: refresh token פג אחרי 7 ימים. אם Gmail/Drive אדומים ב-n8n: Credentials → פותחים → Reconnect. עושים זאת ביום הדמו.
EOF
git add docs/runbook.md
git commit -m "docs: google oauth and drive folder in runbook"
```

---

### Task 9: סיום תוכנית 1

**Files:**
- Modify: `tasks/todo.md`
- Modify: `docs/runbook.md`

- [ ] **Step 1: בדיקה כוללת**

```bash
cd n8n && set -a && source .env && set +a
docker compose ps --format '{{.Name}} {{.State}}'
curl -s "https://$NGROK_DOMAIN/healthz"
../airtable/verify-schema.sh
/opt/homebrew/opt/libpq/bin/psql "$SUPABASE_DB_URL" -Atc "select 1"
curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" http://localhost:5678/api/v1/workflows | jq '.data|length'
grep -cE '^[A-Z_]+=.+' .env
```
Expected: שני `running`, `{"status":"ok"}`, `schema OK`, `1`, `0`, `15` (כל המשתנים מלאים).

- [ ] **Step 2: סימון וקומיט**

```bash
sed -i '' 's/- \[ \] תוכנית 1/- [x] תוכנית 1/' tasks/todo.md
cat >> docs/runbook.md <<'EOF'

## 4. סטטוס תשתית
תוכנית 1 הושלמה. הבא: תוכנית 2 (workflows) ותוכנית 3 (אפליקציה).
EOF
git add tasks/todo.md docs/runbook.md
git commit -m "chore: infrastructure plan complete"
```

---

## בדיקה עצמית מול הספק

- סעיף 9 (תשתית מקומית): Task 2, 3. ✔
- סעיף 5 (נתונים): Task 4, כולל סוגי שדות ורשומות ראשונות. ✔
- סעיף 8 (RAG, מאגר): Task 5. תוכן המדיניות: Task 6. ✔
- סעיף 12 (מגבלות OAuth 7 ימים): Task 8 ו-runbook. ✔
- סעיף 6 credentials לכל השירותים: Task 7 (API), Task 8 (Google). ✔
- לא מכוסה בכוונה: workflows (תוכנית 2), אפליקציה ו-Vercel env (תוכנית 3).
- שמות credentials עקביים: `Airtable ERP`, `OpenAI ERP`, `Telegram Manager`, `Telegram Customer`, `Supabase ERP`, `ERP Webhook Secret`, `Gmail ERP`, `Google Drive ERP`.
