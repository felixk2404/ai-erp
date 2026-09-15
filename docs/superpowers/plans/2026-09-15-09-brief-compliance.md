# Brief Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every gap found in the 2026-09-15 audit of the project against the course brief (`docs/course/project-brief.txt`), so that each literal requirement is either met or explicitly documented as a deliberate deviation.

**Architecture:** Three layers touched in place, no new subsystems. n8n workflow templates in `n8n/workflows/*.json` are edited as JSON and re-imported with `n8n/scripts/import-workflow.sh`; Code-node logic lives in `n8n/code/*.js` with `node:test` tests. The admin app (`app/`, Next.js 16 App Router, Server Actions → WF13) gains one create dialog and search/filter on the two screens that lack them, following the existing `orders/page.tsx` and `invoices/new-invoice-dialog.tsx` patterns exactly. Docs get a single "brief said / we built / why" ledger.

**Tech Stack:** n8n 2.36 (Text Classifier node `@n8n/n8n-nodes-langchain.textClassifier` v1.1, stickyNote), Next.js 16 + React 19 + zod + Vitest, Airtable REST, Python 3 for JSON edits, `node:test` for n8n code.

**Spec:** the audit conversation of 2026-09-15 (three subagent reports) summarised in `tasks/todo.md` § "סקירת תאימות למסמך הקורס (2026-09-15)". Brief: `docs/course/project-brief.txt`.

## Global Constraints

- All user-facing strings Hebrew, RTL; CSS logical properties only (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`).
- Airtable filter values always go through `escapeFormula` (`app/src/lib/airtable.ts:16`).
- Writes from the app go through WF13 only (`erpCreate`/`erpUpdate`/`post` in `app/src/lib/n8n.ts`); never Airtable directly.
- n8n JSON edits: never touch `workflows/exported/`; edit the numbered template, then `n8n/scripts/import-workflow.sh workflows/<file>.json` (no `--activate` needed — import preserves active state), then `docker compose restart n8n` only if a trigger changed.
- `retryOnFail` only on idempotent nodes (reads/updates), never on creates or sends.
- Commit messages: conventional prefix, English, explain *why*; end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Every task ends green: `pnpm test && pnpm typecheck && pnpm lint` in the touched app, `node --test` in `n8n/code`.

---

### Task 1: VAT rate by document date (brief §10: 17% before 2025-01-01)

**Files:**
- Modify: `n8n/workflows/01-invoices-validate.json` — node `Compute`, assignments `c` (VatRate), `d` (VatAmount), `e` (Total)
- Create: `n8n/code/vat-rate.js`, `n8n/code/vat-rate.test.js`

**Interfaces:**
- Produces: `vatRate(isoDate: string): number` → `0.17` for dates before `2025-01-01`, else `0.18`. Used only as the tested reference for the inline expression (n8n Set nodes cannot import files).

- [ ] **Step 1: Write the failing test** — `n8n/code/vat-rate.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { vatRate, VAT_CHANGE_DATE } = require('./vat-rate.js');

test('18% from 2025-01-01, 17% before — the rule in the course brief §10', () => {
  assert.equal(vatRate('2024-12-31T23:59:59.000Z'), 0.17);
  assert.equal(vatRate('2025-01-01T00:00:00.000Z'), 0.18);
  assert.equal(vatRate('2026-09-15T10:00:00.000Z'), 0.18);
  assert.equal(VAT_CHANGE_DATE, '2025-01-01');
});

test('missing or unparsable date falls back to today\'s rate, never to 0', () => {
  assert.equal(vatRate(undefined), 0.18);
  assert.equal(vatRate('not a date'), 0.18);
});
```

- [ ] **Step 2: Run it to verify it fails** — `cd n8n/code && node --test vat-rate.test.js` → FAIL: `Cannot find module './vat-rate.js'`.

- [ ] **Step 3: Implement** — `n8n/code/vat-rate.js`:

```js
// vat-rate.js — שיעור המע"מ לפי תאריך המסמך (מסמך הקורס §10: 18% מ-1.1.2025, 17% לפני).
// הביטוי עצמו יושב בצומת Compute של WF1 (Set node, אין import), והקובץ הזה הוא ההגדרה הנבדקת שלו.
// תאריך חסר או שבור מקבל את השיעור הנוכחי — חשבונית בלי Created היא חשבונית של היום, לא של 2024.
const VAT_CHANGE_DATE = '2025-01-01';

function vatRate(isoDate) {
  const d = String(isoDate || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && d < VAT_CHANGE_DATE ? 0.17 : 0.18;
}

module.exports = { vatRate, VAT_CHANGE_DATE };
```

- [ ] **Step 4: Run tests** — `node --test vat-rate.test.js` → 2 pass.

- [ ] **Step 5: Put the same rule into WF1** — in `01-invoices-validate.json`, node `Compute`, replace the three assignment values:

```json
{"id": "c", "name": "VatRate", "value": "={{ (String($('Loop Over Items').first().json.fields.Created || '').slice(0, 10) < '2025-01-01' && /^\\d{4}-\\d{2}-\\d{2}$/.test(String($('Loop Over Items').first().json.fields.Created || '').slice(0, 10))) ? 0.17 : 0.18 }}", "type": "number"},
{"id": "d", "name": "VatAmount", "value": "={{ $('Loop Over Items').first().json.fields.VatAmount || Math.round($('Loop Over Items').first().json.fields.Amount * $json.VatRate * 100) / 100 }}", "type": "number"},
{"id": "e", "name": "Total", "value": "={{ $('Loop Over Items').first().json.fields.Total || Math.round($('Loop Over Items').first().json.fields.Amount * (1 + $json.VatRate) * 100) / 100 }}", "type": "number"}
```

  Caveat: in a Set node, `$json.VatRate` refers to the *incoming* item, not the assignment above it. So VatAmount/Total must repeat the expression instead. Use this Python edit so all three carry the same inline rule:

```python
import json
f = 'n8n/workflows/01-invoices-validate.json'
d = json.load(open(f))
CREATED = "String($('Loop Over Items').first().json.fields.Created || '').slice(0, 10)"
RATE = f"(({CREATED} < '2025-01-01' && /^\\\\d{{4}}-\\\\d{{2}}-\\\\d{{2}}$/.test({CREATED})) ? 0.17 : 0.18)"
AMOUNT = "$('Loop Over Items').first().json.fields.Amount"
for n in d['nodes']:
    if n['name'] == 'Compute':
        for a in n['parameters']['assignments']['assignments']:
            if a['name'] == 'VatRate':   a['value'] = f"={{{{ {RATE} }}}}"
            if a['name'] == 'VatAmount': a['value'] = f"={{{{ $('Loop Over Items').first().json.fields.VatAmount || Math.round({AMOUNT} * {RATE} * 100) / 100 }}}}"
            if a['name'] == 'Total':     a['value'] = f"={{{{ $('Loop Over Items').first().json.fields.Total || Math.round({AMOUNT} * (1 + {RATE}) * 100) / 100 }}}}"
        n['notes'] = 'מע"מ לפי תאריך המסמך (מסמך הקורס §10): 17% לפני 1.1.2025, 18% אחריו. ההגדרה הנבדקת ב-n8n/code/vat-rate.js.'
json.dump(d, open(f, 'w'), ensure_ascii=False, indent=2); open(f, 'a').write('\n')
```

- [ ] **Step 6: Verify the expression logic with plain Node** (the same JS the n8n sandbox will run):

```bash
node -e "
const CREATED=(c)=>String(c||'').slice(0,10);
const rate=(c)=>((CREATED(c)<'2025-01-01' && /^\d{4}-\d{2}-\d{2}$/.test(CREATED(c)))?0.17:0.18);
console.assert(rate('2024-06-01T00:00:00Z')===0.17); console.assert(rate('2026-09-15T00:00:00Z')===0.18); console.assert(rate(undefined)===0.18); console.log('expr ok')"
```

- [ ] **Step 7: Import and read back** — `cd n8n && ./scripts/import-workflow.sh workflows/01-invoices-validate.json` → `active=true`; then `./scripts/n8n-api.sh GET /workflows/ZT0p1wXRsraCrUqA | python3 -c "import json,sys; d=json.load(sys.stdin); print([a['value'][:60] for n in d['nodes'] if n['name']=='Compute' for a in n['parameters']['assignments']['assignments'] if a['name']=='VatRate'])"` shows the new expression.

- [ ] **Step 8: Commit** — `git add n8n/code/vat-rate.js n8n/code/vat-rate.test.js n8n/workflows/01-invoices-validate.json && git commit -m "feat(n8n): VAT rate follows the document date (17% before 2025-01-01)"`

---

### Task 2: WF8 runs every minute (brief §7)

**Files:**
- Modify: `n8n/workflows/08-invoice-pdf.json` — node `Every 5 Minutes` → rename `Every Minute`, `minutesInterval: 1`; update all `connections` keys referencing the old name.

- [ ] **Step 1: Edit with Python** (renaming a node in n8n means renaming it in `connections` too):

```python
import json
f='n8n/workflows/08-invoice-pdf.json'; d=json.load(open(f))
OLD, NEW = 'Every 5 Minutes', 'Every Minute'
for n in d['nodes']:
    if n['name']==OLD:
        n['name']=NEW; n['parameters']['rule']['interval'][0]['minutesInterval']=1
        n['notes']='כל דקה, כמו במסמך הקורס §7. ה-lease של 15 דקות ב-PdfLockedAt מונע הפקה כפולה גם בקצב הזה.'
d['connections'][NEW]=d['connections'].pop(OLD)
json.dump(d,open(f,'w'),ensure_ascii=False,indent=2); open(f,'a').write('\n')
```

- [ ] **Step 2: Validate the graph** — `python3 -c "import json;d=json.load(open('n8n/workflows/08-invoice-pdf.json'));names={n['name'] for n in d['nodes']};assert all(k in names for k in d['connections']),'dangling connection';print('ok')"`.

- [ ] **Step 3: Import + restart** (schedule trigger changed): `./scripts/import-workflow.sh workflows/08-invoice-pdf.json && docker compose restart n8n && sleep 40`. Then confirm two executions one minute apart: `./scripts/n8n-api.sh GET "/executions?workflowId=wNxCRwm0N2F6Z8TS&limit=3"` — `startedAt` values 60 s apart.

- [ ] **Step 4: Update docs that say 5 minutes** — `grep -rn "5 דקות\|5 minutes\|כל 5" README.md docs/runbook.md docs/demo.md store/README.md` and change each WF8 mention to "כל דקה"; in `docs/runbook.md` §7.1 the `order_status` note "עד כ-7 דקות" becomes "עד כ-3 דקות (פולינג של דקה ועוד כדקה-שתיים של הפקה)".

- [ ] **Step 5: Commit** — `git add n8n/workflows/08-invoice-pdf.json README.md docs/ store/README.md && git commit -m "feat(n8n): WF8 polls every minute as the brief specifies"`

---

### Task 3: RAG no longer promises what the bot cannot do (brief §6)

**Files:**
- Modify: `docs/course/policies/03-shipping-and-delivery.md:40`

- [ ] **Step 1: Replace the sentence.** Current line 40 ends with: `ניתן גם לשאול את בוט שירות הלקוחות "איפה ההזמנה שלי?" עם מספר ההזמנה, והבוט יחזיר את הסטטוס העדכני.` Replace that sentence with: `את הסטטוס העדכני רואים בעמוד מעקב ההזמנה באתר (מספר הזמנה + אימייל); בוט שירות הלקוחות יפנה אתכם לשם.`

- [ ] **Step 2: Re-index and verify count unchanged in kind** — `cd n8n && ./scripts/webhook.sh reindex-policies && ./scripts/rag-count.sh` → `policy: ~78`, `product: 34`.

- [ ] **Step 3: Verify the agent now agrees with itself** — `scratchpad/local-erp.sh '{"action":"support","message":"איפה ההזמנה שלי? ORD-0001","sessionId":"plan-t3"}'` → reply points to the tracking page, does not claim to fetch status.

- [ ] **Step 4: Commit** — `git add docs/course/policies/03-shipping-and-delivery.md && git commit -m "fix(rag): shipping policy no longer promises bot-side order status"`

---

### Task 4: Data scripts and schema doc

**Files:**
- Modify: `airtable/create-tables.sh:45` (loop), `airtable/schema.md:12` (statuses), `airtable/schema.md:14` (Items row)

- [ ] **Step 1: create-tables.sh** — change `for t in Invoices Leads Orders; do` to `for t in Invoices Leads Orders Tasks; do`.
- [ ] **Step 2: schema.md line 12** — statuses cell becomes `new / validated / generated / paid / error`.
- [ ] **Step 3: schema.md line 14** — the row starts with `| Items |`; prepend the table cell so it reads `| Invoices | Items | Long text | ...` (keep the rest of the row).
- [ ] **Step 4: Verify** — `bash airtable/verify-schema.sh` → `schema OK`; `grep -c "^| Invoices |" airtable/schema.md` increases by 1.
- [ ] **Step 5: Commit** — `git add airtable/ && git commit -m "fix(airtable): Tasks.Created in the rename loop; schema doc lists paid and fixes the Items row"`

---

### Task 5: Sticky note on every workflow (brief §7: "כל אחד פותח בפתק דביק")

**Files:**
- Create: `n8n/scripts/add-sticky-notes.py`
- Modify: all `n8n/workflows/*.json` (15 files)

**Interfaces:**
- Produces: idempotent script; a node `{"type":"n8n-nodes-base.stickyNote","typeVersion":1,"name":"מה זה","position":[-600,-320],"parameters":{"content":"…","height":220,"width":420,"color":4}}` at the top-left of each canvas.

- [ ] **Step 1: Write the script** — `n8n/scripts/add-sticky-notes.py`:

```python
#!/usr/bin/env python3
"""מוסיף (או מעדכן) פתק דביק בראש כל workflow — מסמך הקורס §7 דורש שכל תהליך ייפתח בפתק שמסביר מה הוא עושה ומה הוא צריך.
בטוח להרצה חוזרת: פתק קיים בשם "מה זה" מוחלף, לא מוכפל."""
import json, glob, os
ROOT = os.path.join(os.path.dirname(__file__), '..', 'workflows')
NOTES = {
 '00-error':            ('WF-Error — התראות שגיאה', 'כל כשל בכל workflow מגיע לכאן (settings.errorWorkflow). רעש רשת חולף (socket hang up בזמן שינה של המק) מסונן; תקלה אמיתית → טלגרם לבעלים; אם גם הטלגרם נכשל → משימה ב-Airtable.', 'Telegram Manager, Airtable ERP'),
 '01-invoices-validate':('WF1 — אימות חשבוניות', 'טריגר Airtable (Created, כל דקה). בודק סכום ולקוח, מקצה INV-000N, מחשב מע"מ לפי תאריך (17%/18%) וסה"כ, מסמן validated או error + משימת תיקון.', 'Airtable ERP'),
 '02-leads-dedupe':     ('WF2 — קליטת לידים וכפילויות', 'טריגר Airtable (Created, כל דקה). ליד עם אותו מייל, או אותו טלפון (ספרות בלבד), מסומן Duplicate; אחרת New.', 'Airtable ERP'),
 '03-sales-cold-email': ('WF3 — סוכן מכירות (מיילים קרים)', 'כל 3 שעות, או POST /run-sales. בוחר ליד New אחד, סוכן LLM כותב מייל קר בעברית (prompts/sales.md), שולח ב-Gmail ורק אז מסמן Contacted.', 'Airtable ERP, OpenAI ERP, Gmail ERP, ERP Webhook Secret'),
 '04-sales-replies':    ('WF4 — סוכן מכירות (תשובות)', 'Gmail כל 30 דקות. תשובה מליד Contacted מסווגת (מעוניין / לא / הסר / אוטומטי): מעוניין → Qualified + משימת שיחה; לא מעוניין או הסר → Dead; אוטומטי → מתעלמים.', 'Gmail ERP, Airtable ERP, OpenAI ERP'),
 '05-customer-service': ('WF5 — סוכן שירות לקוחות (טלגרם)', 'בוט הלקוחות. תפריט קטלוג בכפתורים, לכידת ליד ("מעוניין"), שיתוף טלפון, וכל טקסט חופשי → WF5-core.', 'Telegram Customer, Airtable ERP'),
 '05b-support-core':    ('WF5-core — סוכן שירות לקוחות', 'הליבה המשותפת לטלגרם, לאתר ולחנות. RAG משני כלים (מדיניות, מוצרים) ב-pgvector, check_stock חי מ-Airtable, ו-handoff לנציג. הפלט עובר שער דטרמיניסטי (code/finalize-reply.js).', 'OpenAI ERP, Supabase ERP, Airtable ERP'),
 '05c-handoff':         ('WF5-handoff — מסירה לנציג', 'כלי של הסוכן. מאמת שם וטלפון בצד השרת, יוצר Lead + Task ומודיע לבעלים.', 'Airtable ERP, Telegram Manager'),
 '06-policies-embed':   ('WF6 — מדיניות → מאגר וקטורי', 'POST /reindex-policies. קורא את docs/course/policies/*.md, מוחק את הגרסה הקודמת ומטמיע מחדש (text-embedding-3-small). להריץ אחרי כל שינוי מדיניות.', 'OpenAI ERP, Supabase ERP, ERP Webhook Secret'),
 '07-products-embed':   ('WF7 — מוצרים → מאגר וקטורי', 'POST /reindex-products. קורא את Products מ-Airtable ומטמיע מחדש. להריץ אחרי שינוי בקטלוג.', 'Airtable ERP, OpenAI ERP, Supabase ERP, ERP Webhook Secret'),
 '08-invoice-pdf':      ('WF8 — הפקת PDF חשבונית', 'כל דקה. תופס חשבונית validated אחת (lease של 15 דקות ב-PdfLockedAt), בונה HTML עברי RTL, ממיר ל-PDF ב-Gotenberg, מעלה לדרייב, משתף בקישור, מסמן generated + PdfUrl.', 'Airtable ERP, Google Drive ERP, Gotenberg (docker)'),
 '09-manager-telegram': ('WF9 — סוכן המנהל (טלגרם)', 'בוט הבעלים. תנאי Is Owner על Chat ID (מסמך הקורס, נספח) — כל אחד אחר מקבל סירוב. שאלות → WF9-core.', 'Telegram Manager'),
 '09b-manager-core':    ('WF9-core — סוכן המנהל', 'הליבה המשותפת לטלגרם ולאפליקציה. Invoices/Leads/Tasks/Orders מסוכמים בצמתי Summarize + Aggregate, והסוכן (בלי כלים) רק מנסח בעברית.', 'Airtable ERP, OpenAI ERP'),
 '10-order':            ('WF10 — הזמנה מהחנות', 'תת-workflow של WF13. מאמת, מתמחר מהקטלוג (לא מהדפדפן), מספר ORD/INV, יוצר לקוח/הזמנה/חשבונית, מוריד מלאי, שולח מייל אישור ומודיע לבעלים.', 'Airtable ERP, Gmail ERP, Telegram Manager'),
 '13-api':              ('WF13 — API לאפליקציה ולחנות', 'POST /erp עם x-erp-secret. מנתב create/update (טבלאות ושדות ברשימת היתר), chat (מנהל), support (שירות), order (→ WF10), order_status. הגבול היחיד שחשוף החוצה.', 'ERP Webhook Secret, Airtable ERP'),
}
for path in sorted(glob.glob(os.path.join(ROOT, '*.json'))):
    key = os.path.basename(path)[:-5]
    if key not in NOTES: continue
    title, what, needs = NOTES[key]
    d = json.load(open(path, encoding='utf-8'))
    d['nodes'] = [n for n in d['nodes'] if not (n['type'] == 'n8n-nodes-base.stickyNote' and n['name'] == 'מה זה')]
    d['nodes'].insert(0, {'type': 'n8n-nodes-base.stickyNote', 'typeVersion': 1, 'name': 'מה זה', 'position': [-620, -340],
        'parameters': {'content': f'## {title}\n{what}\n\n**צריך:** {needs}', 'height': 240, 'width': 460, 'color': 4}})
    json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2); open(path, 'a').write('\n')
    print('noted', key)
```

- [ ] **Step 2: Run twice** — `python3 n8n/scripts/add-sticky-notes.py && python3 n8n/scripts/add-sticky-notes.py` then `for f in n8n/workflows/*.json; do python3 -c "import json,sys;d=json.load(open('$f'));print('$f', sum(1 for n in d['nodes'] if n['type']=='n8n-nodes-base.stickyNote'))"; done` → every file prints `1` (idempotent).
- [ ] **Step 3: Import all** — `cd n8n && for f in workflows/*.json; do ./scripts/import-workflow.sh "$f"; done` (order: `00-error`, `09b-manager-core`, then the rest — the script substitutes `__WF_*_ID__` from config.json, which already holds every id, so alphabetical order is fine now). All print `active=true`.
- [ ] **Step 4: Commit** — `git add n8n/scripts/add-sticky-notes.py n8n/workflows/*.json && git commit -m "feat(n8n): every workflow opens with a sticky note, as the brief requires"`

---

### Task 6: WF4 classifies the reply before changing the lead (brief §5 "סוכן")

**Files:**
- Modify: `n8n/workflows/04-sales-replies.json`

**Interfaces:**
- New nodes: `Reply Text` (Set) → `Classify Reply` (`@n8n/n8n-nodes-langchain.textClassifier` v1.1, 4 outputs in category order) + `OpenAI Chat Model` (`@n8n/n8n-nodes-langchain.lmChatOpenAi` v1.3, cred `__CRED_OPENAI__`, model `__MODEL__`) → `Mark Qualified` (existing) / `Mark Dead` (new Airtable update, `Status: Dead`, `Note` appended) / `Ignored — אוטומטי` (noOp).
- Category order (defines output index): `interested` (0), `not_interested` (1), `unsubscribe` (2), `auto_reply` (3).

- [ ] **Step 1: Edit with Python** — run from repo root:

```python
import json
f='n8n/workflows/04-sales-replies.json'; d=json.load(open(f))
lead = "$('Contacted Lead').first().json.records[0]"
nodes = d['nodes']; c = d['connections']
nodes += [
 {'name':'Reply Text','type':'n8n-nodes-base.set','typeVersion':3.4,'position':[880,0],
  'parameters':{'assignments':{'assignments':[{'id':'t','name':'text','value':"={{ ($('Gmail Trigger').first().json.Subject || '') + '\\n' + ($('Gmail Trigger').first().json.snippet || '') }}",'type':'string'}]},'options':{}},
  'notes':'הנושא והתקציר של המייל — זה מה שהמסווג קורא. מספיק לכוונה, בלי לטעון את הגוף המלא.'},
 {'name':'Classify Reply','type':'@n8n/n8n-nodes-langchain.textClassifier','typeVersion':1.1,'position':[1100,0],
  'parameters':{'inputText':'={{ $json.text }}',
   'categories':{'categories':[
     {'category':'interested','description':'הליד מביע עניין, שואל על מחיר, כמות, זמינות, או מבקש שיחה/פגישה/הצעת מחיר.'},
     {'category':'not_interested','description':'הליד מסרב בנימוס או בלי: לא רלוונטי, אין צורך, לא עכשיו, תודה אבל לא.'},
     {'category':'unsubscribe','description':'הליד מבקש להפסיק לקבל מיילים: המילה "הסר", unsubscribe, remove me, תפסיקו לשלוח.'},
     {'category':'auto_reply','description':'תשובה אוטומטית: מחוץ למשרד, בחופשה, out of office, auto-reply, delivery failure, mailer-daemon, bounce.'}]},
   'options':{'fallback':'other','systemPromptTemplate':'סווג את תשובת המייל של הליד לאחת מהקטגוריות: {categories}. השתמש בהוראות הפורמט שלמטה. אל תסביר, החזר רק JSON.'}},
  'notes':'מסמך הקורס קורא לזה "סוכן מכירות — בדיקת תשובות": כאן הסוכן באמת קורא את התשובה במקום להניח שכל מייל = עניין. הסדר של הקטגוריות קובע את הפלטים: 0 מעוניין, 1 לא, 2 הסר, 3 אוטומטי, 4 אחר (fallback).'},
 {'name':'Classifier Model','type':'@n8n/n8n-nodes-langchain.lmChatOpenAi','typeVersion':1.3,'position':[1100,220],
  'parameters':{'model':{'__rl':True,'mode':'list','value':'__MODEL__'},'options':{}},
  'credentials':{'openAiApi':{'id':'__CRED_OPENAI__','name':'OpenAI ERP'}}},
 {'name':'Mark Dead','type':'n8n-nodes-base.airtable','typeVersion':2.2,'position':[1360,160],
  'parameters':{'authentication':'airtableTokenApi','operation':'update',
   'base':{'__rl':True,'mode':'id','value':'__AIRTABLE_BASE_ID__'},'table':{'__rl':True,'mode':'id','value':'__TBL_LEADS__'},
   'columns':{'mappingMode':'defineBelow','value':{'id':f'={{{{ {lead}.id }}}}','Status':'Dead',
     'Note':f"={{{{ (({lead}.fields.Note || '') + ' ' + ($('Classify Reply').first().json.category === 'unsubscribe' ? 'ביקש הסרה מהתפוצה' : 'השיב שלא מעוניין') + ' (' + $now.toFormat('dd/MM/yyyy') + ')').trim() }}}}"},
     'matchingColumns':['id'],
     'schema':[{'id':'id','displayName':'id','required':False,'defaultMatch':True,'display':True,'type':'string','readOnly':True,'removed':False},
               {'id':'Status','displayName':'Status','required':False,'defaultMatch':False,'canBeUsedToMatch':True,'display':True,'type':'string','readOnly':False,'removed':False},
               {'id':'Note','displayName':'Note','required':False,'defaultMatch':False,'canBeUsedToMatch':True,'display':True,'type':'string','readOnly':False,'removed':False}]},
   'options':{'typecast':True}},
  'credentials':{'airtableTokenApi':{'id':'__CRED_AIRTABLE__','name':'Airtable ERP'}},
  'retryOnFail':True,'maxTries':3,'waitBetweenTries':5000,
  'notes':'Dead = לא נשלח לו יותר (WF3 בוחר רק New). "הסר" מכבד את ההבטחה שבשורה האחרונה של המייל הקר.'},
 {'name':'Ignored — אוטומטי','type':'n8n-nodes-base.noOp','typeVersion':1,'position':[1360,320],'parameters':{},
  'notes':'אוטו-רספונדר או bounce. הליד נשאר Contacted כדי שתשובה אמיתית מאוחר יותר עדיין תיתפס.'}]
# rewire: Has Lead(true) -> Reply Text -> Classify Reply -> [Mark Qualified, Mark Dead, Mark Dead, Ignored, Ignored]
c['Has Lead']['main'][0] = [{'node':'Reply Text','type':'main','index':0}]
c['Reply Text'] = {'main':[[{'node':'Classify Reply','type':'main','index':0}]]}
c['Classify Reply'] = {'main':[
  [{'node':'Mark Qualified','type':'main','index':0}],
  [{'node':'Mark Dead','type':'main','index':0}],
  [{'node':'Mark Dead','type':'main','index':0}],
  [{'node':'Ignored — אוטומטי','type':'main','index':0}],
  [{'node':'Ignored — אוטומטי','type':'main','index':0}]]}
c['Classifier Model'] = {'ai_languageModel':[[{'node':'Classify Reply','type':'ai_languageModel','index':0}]]}
# Mark Qualified used $json.records[0].id from Contacted Lead; after the classifier $json is the classifier output — switch to the named reference
for n in nodes:
    if n['name']=='Mark Qualified':
        n['parameters']['columns']['value']['id'] = f'={{{{ {lead}.id }}}}'
        n['position'] = [1360,0]
    if n['name']=='Create Call Task': n['position'] = [1600,0]
json.dump(d,open(f,'w'),ensure_ascii=False,indent=2); open(f,'a').write('\n'); print('ok')
```

- [ ] **Step 2: Validate graph** — every `connections` key and target exists in `nodes`; `Classify Reply` has 5 main outputs listed; `Mark Qualified` id expression no longer starts with `={{ $json.records`.

```bash
python3 -c "
import json;d=json.load(open('n8n/workflows/04-sales-replies.json'));N={n['name'] for n in d['nodes']}
for k,v in d['connections'].items():
  assert k in N,k
  for arr in v.get('main',[])+v.get('ai_languageModel',[]):
    for t in arr: assert t['node'] in N,t
print('outputs of Classify Reply:',len(d['connections']['Classify Reply']['main']))
print([n['parameters']['columns']['value']['id'] for n in d['nodes'] if n['name']=='Mark Qualified'])"
```

- [ ] **Step 3: Import + restart** (trigger unchanged, but the LLM sub-node must register): `./scripts/import-workflow.sh workflows/04-sales-replies.json` → `active=true`. No placeholder warning (script exits 1 if `__X__` remains).

- [ ] **Step 4: Live test with two real emails** — from a lead that is `Contacted` in Airtable (create one via the admin Leads dialog with your own second address, run "שלח מייל לליד הבא", reply): (a) reply "מעוניין, כמה עולות 20 יחידות?" → within 30 min (or trigger manually in n8n UI: open WF4 → Execute) lead becomes `Qualified` and a Task "להתקשר ל…" exists; (b) from another Contacted lead reply "הסר" → lead becomes `Dead`, Note contains "ביקש הסרה". Record both execution ids in `tasks/todo.md`.

- [ ] **Step 5: Docs** — `docs/demo.md`: after step 6 add step 6b: `להשיב למייל הקר "מעוניין, 20 יחידות" → הליד Qualified + משימת שיחה; להשיב "הסר" מליד אחר → Dead`. `docs/runbook.md` §7 WF4 row: describe the four outcomes. README workflow table WF4 row: "תשובה למייל מסווגת: מעוניין → Qualified + משימה; לא מעוניין / הסר → Dead; אוטומטי → מתעלמים".

- [ ] **Step 6: Commit** — `git add n8n/workflows/04-sales-replies.json docs/ README.md && git commit -m "feat(n8n): WF4 classifies the reply — Qualified, Dead, or ignored — instead of treating every email as interest"`

---

### Task 7: Shared Airtable search formula + search on Leads (brief §8)

**Files:**
- Create: `app/src/lib/search-formula.ts`, `app/src/lib/search-formula.test.ts`
- Modify: `app/src/app/(app)/leads/page.tsx` (add `q` param + search form), `app/src/app/(app)/orders/page.tsx:34-38` (use helper), `app/src/app/(app)/invoices/page.tsx` (use helper for its `q`)

**Interfaces:**
- Produces: `searchFormula(fields: string[], q: string): string | undefined` — returns an Airtable `OR(FIND('needle', LOWER({F})), …)` formula with the needle lowercased and escaped via `escapeFormula`, or `undefined` for blank `q`.

- [ ] **Step 1: Failing test** — `app/src/lib/search-formula.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { searchFormula } from './search-formula';

describe('searchFormula', () => {
  it('builds a case-insensitive OR over the given fields', () => {
    expect(searchFormula(['Name', 'Email'], ' Dav ')).toBe("OR(FIND('dav', LOWER({Name})), FIND('dav', LOWER({Email})))");
  });
  it('returns undefined for a blank query so the caller sends no filter', () => {
    expect(searchFormula(['Name'], '')).toBeUndefined();
    expect(searchFormula(['Name'], '   ')).toBeUndefined();
  });
  it("escapes quotes and backslashes so a user cannot break out of the formula", () => {
    expect(searchFormula(['Name'], "o'neil\\")).toBe("OR(FIND('o\\'neil\\\\', LOWER({Name})))");
  });
});
```

- [ ] **Step 2: Run to fail** — `cd app && pnpm vitest run src/lib/search-formula.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** — `app/src/lib/search-formula.ts`:

```ts
import { escapeFormula } from './airtable';

/**
 * חיפוש חופשי ב-Airtable: FIND על כל שדה, לא רגיש לאותיות. הערך עובר escapeFormula —
 * זה הגבול שבו קלט של משתמש נכנס לתוך נוסחה, ובלעדיו גרש אחד שובר את השאילתה.
 * מחזיר undefined לשאילתה ריקה כדי שהקורא לא ישלח filterByFormula בכלל.
 */
export function searchFormula(fields: string[], q: string): string | undefined {
  const needle = escapeFormula(q.trim().toLowerCase());
  if (!needle) return undefined;
  return `OR(${fields.map((f) => `FIND('${needle}', LOWER({${f}}))`).join(', ')})`;
}
```

  Note: `app/src/lib/airtable.ts` has `import 'server-only'` at line 1, which throws in Vitest's node environment. Check how `airtable.test.ts` handles it (it mocks `server-only`); if the test fails on that import, add `vi.mock('server-only', () => ({}))` at the top of the new test exactly as `airtable.test.ts` does.

- [ ] **Step 4: Run to pass** — 3 pass.

- [ ] **Step 5: Leads page** — in `leads/page.tsx`: type `searchParams: Promise<{ status?: string; q?: string }>`; destructure `q = ''`; build `filters` like orders:

```ts
const filters: string[] = [];
if (status) filters.push(`{Status}='${escapeFormula(status)}'`);
const search = searchFormula(['Name', 'Email', 'Company', 'Phone'], q);
if (search) filters.push(search);
const leads = await list<LeadFields>('Leads', { filter: filters.length ? `AND(${filters.join(',')})` : undefined, sort: [{ field: 'Created', direction: 'desc' }] });
const href = (s: string) => `/leads?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(q ? { q } : {}) })}`.replace(/\?$/, '');
```

  Add the search `<form role="search">` block from `orders/page.tsx:51-60` (same markup, placeholder `חיפוש לפי שם, אימייל או חברה`), make the status links use `href(s)`, and make the EmptyState hint `status || q ? 'נסה סינון אחר' : 'הוסף ליד ראשון'`. Import `searchFormula` and `Button`.

- [ ] **Step 6: Orders + Invoices use the helper** — replace the inline `OR(FIND(...))` in `orders/page.tsx:35-38` with `const search = searchFormula(['OrderNumber', 'Name', 'Email'], q); if (search) filters.push(search);` and the equivalent in `invoices/page.tsx` (fields `InvoiceNumber`, `CustomerId`). Behaviour identical.

- [ ] **Step 7: Verify** — `pnpm test && pnpm typecheck && pnpm lint`; `pnpm dev` and open `http://localhost:3100/leads?q=דוד&status=New` → filtered list; `?q=` shows all.

- [ ] **Step 8: Commit** — `git add app/src/lib/search-formula.ts app/src/lib/search-formula.test.ts "app/src/app/(app)/leads/page.tsx" "app/src/app/(app)/orders/page.tsx" "app/src/app/(app)/invoices/page.tsx" && git commit -m "feat(app): search on the leads screen, one shared Airtable search formula"`

---

### Task 8: Search and filter on Customers (brief §8)

**Files:**
- Modify: `app/src/app/(app)/customers/page.tsx`

**Interfaces:**
- Filter values (URL `?has=`): `''` all · `invoices` has ≥1 non-error invoice · `none` has none · `open` has an invoice whose status is not `paid`/`error`. Computed in memory from the two lists the page already fetches (no extra Airtable calls).

- [ ] **Step 1: Add params and search** — signature `CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; has?: string }> })`; `const { q = '', has: requested = '' } = await searchParams; const has = ['invoices','none','open'].includes(requested) ? requested : '';`. Customers query gains `filter: searchFormula(['Name', 'Email', 'Phone', 'CustomerId'], q)`.
- [ ] **Step 2: Compute stats with an `open` counter**:

```ts
const stats = new Map<string, { count: number; total: number; open: number }>();
for (const i of invoices) {
  const s = stats.get(i.fields.CustomerId) ?? { count: 0, total: 0, open: 0 };
  s.count += 1; s.total += i.fields.Total ?? 0;
  if (i.fields.Status !== 'paid') s.open += 1;
  stats.set(i.fields.CustomerId, s);
}
const shown = customers.filter((c) => {
  const s = stats.get(c.fields.CustomerId);
  if (has === 'invoices') return !!s;
  if (has === 'none') return !s;
  if (has === 'open') return (s?.open ?? 0) > 0;
  return true;
});
```

- [ ] **Step 3: UI** — above the panel: the same `<form role="search">` as orders (placeholder `חיפוש לפי שם, אימייל, טלפון או מזהה`, hidden `has`), then a `<nav aria-label="סינון">` with four links: `הכל` / `עם חשבוניות` / `בלי חשבוניות` / `חשבונית פתוחה`, built with `href(h)` mirroring orders. Table maps `shown`, EmptyState hint `q || has ? 'נסה סינון אחר' : 'הוסף לקוח ראשון כדי להפיק לו חשבוניות'`. Add an `open` column? No — keep the table; the filter is enough.
- [ ] **Step 4: Verify** — `pnpm test && pnpm typecheck && pnpm lint`; `/customers?has=open` shows only customers with unpaid invoices; `/customers?q=לוי` narrows.
- [ ] **Step 5: Commit** — `git commit -am "feat(app): search and invoice filter on the customers screen"` (only this file changed).

---

### Task 9: Search and status filter on Tasks (consistency with §8)

**Files:**
- Modify: `app/src/app/(app)/tasks/page.tsx`

- [ ] **Step 1: Read the page first** (`sed -n '1,60p'`) to see the current query; then add `searchParams: Promise<{ status?: string; q?: string }>`, whitelist `status` against `TASK_STATUSES`, `filters` = status + `searchFormula(['Title', 'RefId'], q)`, the search form, and a status nav (`הכל` / `פתוחות` / `בוצעו` via `statusMeta('Tasks', s).label`).
- [ ] **Step 2: Verify + commit** — `pnpm test && pnpm typecheck && pnpm lint`; `git commit -am "feat(app): search and status filter on tasks"`.

---

### Task 10: "הזמנה חדשה" in the admin app (brief §8: forms for customer / lead / order / invoice)

**Files:**
- Create: `app/src/app/(app)/orders/parse.ts`, `app/src/app/(app)/orders/parse.test.ts`, `app/src/app/(app)/orders/new-order-dialog.tsx`
- Modify: `app/src/lib/n8n.ts` (add `erpOrder`), `app/src/lib/n8n.test.ts` (test it), `app/src/app/(app)/orders/actions.ts` (add `createOrder`), `app/src/app/(app)/orders/page.tsx` (mount dialog; fetch products), `app/src/lib/types.ts:52` comment

**Interfaces:**
- `erpOrder(order: OrderRequest): Promise<OrderResponse>` in `lib/n8n.ts`, where
  `OrderRequest = { customer: { name; email; phone; address?; city? }; items: { sku; qty }[]; note? }` and
  `OrderResponse = { orderNumber: string; invoiceNumber?: string; total: number }` — exactly the WF13 `order` contract in `docs/runbook.md` §7.1.
- `parseOrderForm(fd: FormData): ParseResult<OrderRequest>` in `orders/parse.ts` using `parseForm` from `lib/parse.ts`.
- `createOrder(prev: FormState, fd: FormData): Promise<FormState>` in `orders/actions.ts`.

- [ ] **Step 1: Failing test for the client** — append to `app/src/lib/n8n.test.ts` (follow the file's existing `mockFetch` helper and env stubs; read lines 1-40 first):

```ts
describe('erpOrder', () => {
  it('posts the WF13 order envelope and returns the order number', async () => {
    mockFetch(200, { ok: true, orderNumber: 'ORD-0042', invoiceNumber: 'INV-0050', total: 218 });
    const r = await erpOrder({ customer: { name: 'דוד לוי', email: 'd@example.com', phone: '050-0000000', address: 'הרצל 1', city: 'תל אביב' }, items: [{ sku: 'TY-PB-20', qty: 1 }] });
    expect(r.orderNumber).toBe('ORD-0042');
    const body = JSON.parse(String((globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] && (((globalThis.fetch as unknown as { mock: { calls: [unknown, RequestInit][] } }).mock.calls[0][1]).body)));
    expect(body.action).toBe('order');
    expect(body.order.items).toEqual([{ sku: 'TY-PB-20', qty: 1 }]);
  });
  it('surfaces the Hebrew business error from WF13 as an ErpError', async () => {
    mockFetch(200, { ok: false, error: 'חלק מהפריטים אינם במלאי בכמות המבוקשת' });
    await expect(erpOrder({ customer: { name: 'x', email: 'x@x.co', phone: '050-0000000' }, items: [{ sku: 'TY-HP-200', qty: 9 }] })).rejects.toThrow('חלק מהפריטים');
  });
  it('rejects a 200 without an orderNumber — "saved" is never a guess', async () => {
    mockFetch(200, { ok: true });
    await expect(erpOrder({ customer: { name: 'x', email: 'x@x.co', phone: '050-0000000' }, items: [{ sku: 'a', qty: 1 }] })).rejects.toThrow(ErpError);
  });
});
```

  (If the file's fetch mock exposes calls differently, adapt the body-extraction line to its helper; the assertions stay.)

- [ ] **Step 2: Run to fail** — `pnpm vitest run src/lib/n8n.test.ts` → FAIL (`erpOrder` not exported).

- [ ] **Step 3: Implement in `lib/n8n.ts`** (after `erpUpdate`):

```ts
export type OrderRequest = {
  customer: { name: string; email: string; phone: string; address?: string; city?: string };
  items: { sku: string; qty: number }[];
  note?: string;
};
export type OrderResponse = { orderNumber: string; invoiceNumber?: string; total: number };

/** הזמנה מהניהול — אותו חוזה WF13 `order` כמו בחנות (runbook §7.1), ולכן אותו WF10: תמחור מהקטלוג, מספור, מלאי, מייל. */
export async function erpOrder(order: OrderRequest): Promise<OrderResponse> {
  const r = await post<Partial<OrderResponse>>('erp', { action: 'order', order });
  if (!r.orderNumber) {
    logError('n8n order no orderNumber', r);
    throw new ErpError('ההזמנה כנראה לא נוצרה — n8n לא החזיר מספר הזמנה. בדקו את ההרצה ב-n8n.');
  }
  return { orderNumber: r.orderNumber, invoiceNumber: r.invoiceNumber, total: r.total ?? 0 };
}
```

- [ ] **Step 4: Run to pass.**

- [ ] **Step 5: Failing parse test** — `orders/parse.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseOrderForm } from './parse';

const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const ok = { name: 'דוד לוי', email: ' D@Example.com ', phone: '050 123 4567', address: 'הרצל 1', city: 'תל אביב', note: '', items: JSON.stringify([{ sku: 'TY-PB-20', qty: 2 }]) };

describe('parseOrderForm', () => {
  it('normalises email and phone and keeps items as sku+qty only', () => {
    const r = parseOrderForm(fd(ok));
    expect(r.ok && r.data).toEqual({ customer: { name: 'דוד לוי', email: 'd@example.com', phone: '0501234567', address: 'הרצל 1', city: 'תל אביב' }, items: [{ sku: 'TY-PB-20', qty: 2 }], note: undefined });
  });
  it('reports field errors by name', () => {
    const r = parseOrderForm(fd({ ...ok, email: 'nope', items: '[]' }));
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.errors.email).toBeTruthy(); expect(r.errors.items).toBeTruthy(); }
  });
  it('caps at 10 lines and 99 per line — the WF10 limits', () => {
    const many = JSON.stringify(Array.from({ length: 11 }, (_, i) => ({ sku: `S${i}`, qty: 1 })));
    const r1 = parseOrderForm(fd({ ...ok, items: many })); expect(r1.ok).toBe(false);
    const r2 = parseOrderForm(fd({ ...ok, items: JSON.stringify([{ sku: 'a', qty: 100 }]) })); expect(r2.ok).toBe(false);
  });
});
```

- [ ] **Step 6: Run to fail**, then **implement `orders/parse.ts`**:

```ts
import { z } from 'zod';
import { parseForm, optionalText, type ParseResult } from '@/lib/parse';
import type { OrderRequest } from '@/lib/n8n';

/** גבולות WF10 (runbook §7.1): עד 10 שורות שונות, כמות 1–99 לשורה. המחיר לא נשלח — הקטלוג קובע. */
export const MAX_LINES = 10;
export const MAX_QTY = 99;

const line = z.object({ sku: z.string().trim().min(1).max(32), qty: z.number().int().min(1).max(MAX_QTY, `עד ${MAX_QTY} יחידות לשורה`) });

const schema = z.object({
  name: z.string().trim().min(2, 'צריך שם מלא').max(60, 'שם ארוך מדי'),
  email: z.string().trim().toLowerCase().pipe(z.email('כתובת אימייל לא תקינה')),
  phone: z.string().transform((s) => s.replace(/\s+/g, '')).refine((v) => /^0\d{1,2}-?\d{7}$/.test(v), 'מספר טלפון לא תקין'),
  address: z.string().trim().max(120, 'כתובת ארוכה מדי').transform(optionalText),
  city: z.string().trim().max(120, 'שם עיר ארוך מדי').transform(optionalText),
  note: z.string().trim().max(500, 'ההערה ארוכה מדי').transform(optionalText),
  items: z.string().transform((s, ctx) => { try { return JSON.parse(s || '[]') as unknown; } catch { ctx.addIssue({ code: 'custom', message: 'שורות לא תקינות' }); return z.NEVER; } })
    .pipe(z.array(line).min(1, 'יש להוסיף לפחות מוצר אחד').max(MAX_LINES, `אפשר עד ${MAX_LINES} מוצרים שונים בהזמנה`)),
});

export function parseOrderForm(fd: FormData): ParseResult<OrderRequest> {
  const r = parseForm(schema, fd, ['name', 'email', 'phone', 'address', 'city', 'note', 'items']);
  if (!r.ok) return r;
  const { name, email, phone, address, city, note, items } = r.data;
  return { ok: true, data: { customer: { name, email, phone, address, city }, items, note } };
}
```

  Check `optionalText` signature in `lib/parse.ts` (`(v: unknown) => string | undefined`) — it fits `.transform`.

- [ ] **Step 7: Run to pass.**

- [ ] **Step 8: Action** — append to `orders/actions.ts`:

```ts
import { erpOrder } from '@/lib/n8n';
import type { FormState } from '@/components/forms/entity-dialog';
import { parseOrderForm } from './parse';

/** הזמנה שהמנהל מקליד (טלפון, דלפק). עוברת את אותו WF10 כמו הזמנה מהחנות — כולל מייל אישור ללקוח. */
export async function createOrder(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseOrderForm(fd);
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    await erpOrder(parsed.data);
  } catch (e) {
    logError('orders.create', e);
    return { error: msg(e, 'שגיאה ביצירת ההזמנה') };
  }
  revalidatePath('/orders');
  revalidatePath('/invoices');
  revalidatePath('/customers');
  revalidatePath('/products');
  revalidatePath('/');
  return { ok: true };
}
```

  (Move the `import` lines to the top of the file with the others.)

- [ ] **Step 9: Dialog** — `orders/new-order-dialog.tsx`, a copy of `invoices/new-invoice-dialog.tsx` with these differences: title `הזמנה חדשה`, description `ההזמנה עוברת את אותו מסלול כמו בחנות: תמחור מהקטלוג, מלאי, חשבונית ומייל אישור ללקוח.`; customer block replaced by five inputs (`name` required autoFocus, `email` type=email dir=ltr required, `phone` type=tel dir=ltr required, `address`, `city`) each with `<FieldError msg={state?.errors?.<field>} />`; an optional `note` `<Input>`; the items grid identical but the hidden input is `<input type="hidden" name="items" value={JSON.stringify(rows.filter(r => r.sku).map(r => ({ sku: r.sku, qty: r.qty })))} />`; totals block shows only `סה״כ משוער` = `sumItems(items)` with the caption `המחיר הסופי, המשלוח והמע״מ נקבעים בשרת`; the action is `createOrder`; success toast `ההזמנה נוצרה. החשבונית והמייל ללקוח בדרך.`; trigger `<DialogTrigger render={<Button data-hotkey="new" />}>הזמנה חדשה</DialogTrigger>`. Product options come from the same `ProductOption` type; filter to `Stock`-bearing or service products is not needed — WF10 validates stock and returns the Hebrew error, which the dialog shows via toast.

- [ ] **Step 10: Mount** — in `orders/page.tsx`: fetch products alongside orders (`list<ProductFields>('Products', { filter: "{Sku}!=''" })` inside the existing `Promise.all` or a second await), and pass `<Header title="הזמנות" actions={<NewOrderDialog products={toProductOptions(products)} />} />`. Update the `types.ts:52` comment: `נכתבת על ידי WF10 — מהחנות או מטופס "הזמנה חדשה" בניהול; האפליקציה מעדכנת רק Status.` and the note at `orders/page.tsx:140` if it says orders come only from the store.

- [ ] **Step 11: Verify** — `pnpm test && pnpm typecheck && pnpm lint`; with n8n up: `pnpm dev`, `/orders` → "הזמנה חדשה" → fill with your own email + one in-stock SKU → toast, new row `ORD-000N` with status `confirmed`, invoice created, Telegram notification, confirmation email received. Then try an out-of-stock SKU (`TY-CB-HD21` per runbook §5.1) → toast with the Hebrew stock error, no row created.

- [ ] **Step 12: Commit** — `git add app/src/lib/n8n.ts app/src/lib/n8n.test.ts "app/src/app/(app)/orders/" app/src/lib/types.ts && git commit -m "feat(app): new order form in the admin app, through the same WF13/WF10 path as the store"`

---

### Task 11: The deviation ledger (brief vs built) and doc sync

**Files:**
- Modify: `README.md` (replace section `## מה נדרש בקורס ומה נבנה מעבר`), `docs/runbook.md` (WF4 row, WF8 cadence), `tasks/todo.md` (audit section: mark done)

- [ ] **Step 1: Replace the README section** with a table (Hebrew), one row per deviation, columns `המסמך אמר | בנינו | למה`:

```markdown
## מה נדרש בקורס ומה נבנה מעבר

הארכיטקטורה של הקורס נשמרה במלואה: Airtable, n8n, שלושה סוכנים, RAG, שני בוטים, Gmail, Drive, WF1–WF9 + WF13, ארבע הטבלאות בשמות השדות המדויקים. הטבלה הבאה מונה כל מקום שבו הפרויקט **סוטה** מהמסמך בכוונה, כדי שלא יהיה צורך לנחש:

| המסמך אמר | בנינו | למה |
|---|---|---|
| ממשק ב-Lovable / Base44, בלי קוד | שני אתרי Next.js 16 בקוד (`app/`, `store/`), אימות, 244 בדיקות | שליטה מלאה ב-RTL, בנגישות ובאבטחה; ידע שניתן להעביר לפורטפוליו |
| `Dashboard.html` בסיסי מהמרצה | `app/` מחליף אותו במלואו | הדשבורד של הקורס היה קובץ HTML אחד עם PAT בדפדפן; כאן הקריאות בצד השרת |
| n8n Cloud | n8n מקומי ב-Docker מאחורי ngrok | Render החינמי נרדם אחרי 15 דקות — לא מתאים לטריגרים. המחיר: הבוטים חיים רק כשהמחשב דולק |
| "אפס קוד" בכל התהליכים | 6 צמתי Code (`n8n/code/*.js`), כולם עם בדיקות `node:test` | לוגיקה שהפרומפט לבדו לא החזיק (כפילות שורות, זליגת הרהור, סיווג שגיאות רשת). קוד נבדק עדיף על ביטוי ארוך בתוך JSON |
| 3–7 צמתים לכל תהליך | WF5 ו-WF10 עם 26 צמתים | תפריט טלגרם מלא וצינור הזמנה עם תמחור, מלאי, חשבונית ומייל. הקטנים נשארו קטנים |
| בלי ריפו, הכל בענן | הכל ב-git: תבניות עם placeholders, פרומפטים, מדיניות, סקריפטי ייבוא | שחזור מאפס בפקודה; היסטוריה לכל שינוי בפרומפט |
| המדיניות בתיבת טקסט בתוך WF6 | 12 קבצי Markdown ב-`docs/course/policies/` | ניתן לעריכה, לבדיקה ולגרסאות; WF6 קורא אותם מהדיסק |
| מאגר וקטורי בזיכרון, נמחק ב-restart | Supabase pgvector קבוע | לא צריך להריץ WF6+WF7 אחרי כל אתחול. **זיכרון השיחה** של הסוכנים עדיין בזיכרון (`memoryBufferWindow`) ונמחק ב-restart |
| חשבונית כ-HTML בדרייב, המרה ידנית ל-PDF | Gotenberg ב-Docker → PDF אמיתי | הלקוח מקבל PDF בקישור מהמייל ומעמוד ההזמנה |
| WF6/WF7 ידניים, "Execute workflow" | webhooks `reindex-policies` / `reindex-products` | ניתן להריץ מהאפליקציה ומסקריפט |
| בלי טיפול בשגיאות ובלי retry | WF-Error לטלגרם + retry על צמתים אידמפוטנטיים | כשל בלילה מגיע כהודעה, לא מתגלה בבוקר |
| המנהל רואה עד 100 חשבוניות | `returnAll` על ארבע טבלאות | בהיקף הפרויקט זה עשרות רשומות; התקרה האמיתית היא חלון ההקשר של המודל |
| "מגיע ריק מנתונים" | 34 מוצרים, לקוחות והזמנות דמו (`airtable/seed*.sh`) | הדגמה חיה צריכה קטלוג; הכל דטרמיניסטי ובטוח להרצה חוזרת |
| WF8 כל דקה | כל דקה (יושר ב-15.9) | — |
| 17% לפני 1.1.2025 | ממומש ב-WF1 לפי תאריך המסמך | — |
| הבחנה בין חשבונית / חשבונית מס / קבלה | סוג מסמך אחד: חשבונית מס | הסכימה במסמך עצמו (8 שדות ב-Invoices) לא כוללת שדה לסוג מסמך; הידע על סוגי המסמכים קיים ב-RAG (`06-israeli-tax-invoice-rules.md`) |
| "משימות להיום" בדשבורד | "משימות פתוחות" | ל-Tasks אין תאריך יעד בסכימה של הקורס |
```

  Count the Code nodes before writing "6": `grep -l '"n8n-nodes-base.code"' n8n/workflows/*.json | wc -l` and `grep -c '"n8n-nodes-base.code"' n8n/workflows/*.json` — use the real total.

- [ ] **Step 2: runbook + todo** — runbook §7 WF4 row as in Task 6; `tasks/todo.md`: under the 2026-09-15 audit section mark each closed item `[x]` with the commit hash.

- [ ] **Step 3: Commit** — `git add README.md docs/runbook.md tasks/todo.md && git commit -m "docs: ledger of every deliberate deviation from the course brief"`

---

### Task 12: Refresh exports, full verification, push

- [ ] **Step 1:** `cd n8n && bash scripts/export-workflows.sh` (exported/ mirrors the live instance after Tasks 1, 2, 5, 6).
- [ ] **Step 2:** `cd app && pnpm test && pnpm typecheck && pnpm lint && pnpm build` and the same in `store/` (store untouched, but `pnpm test` proves nothing regressed via shared conventions); `cd n8n/code && node --test`.
- [ ] **Step 3:** Live: `docker exec n8n-n8n-1 n8n list:workflow --active=true | wc -l` → 15; `scratchpad/local-erp.sh '{"action":"order_status","orderNumber":"ORD-0001","email":"x@x.co"}'` → `{"ok":false,"error":"ההזמנה לא נמצאה"}` HTTP 404.
- [ ] **Step 4:** `git add n8n/workflows/exported && git commit -m "chore(n8n): refresh exported workflows from the live instance" && git push origin main`.
- [ ] **Step 5 (user):** `cd app && vercel --prod --yes` — the Claude session cannot run deploys (permission classifier). Then `curl -s https://ai-erp-rho.vercel.app/login | grep -c 'הזמנה חדשה'` is not possible (page needs a session); instead log in and confirm the button on `/orders`.

---

## Self-review

- Spec coverage: order form (T10), customers search+filter (T8), leads search (T7), tasks (T9), WF4 classifier (T6), WF8 cadence (T2), VAT date (T1), sticky notes (T5), policy contradiction (T3), scripts/schema (T4), ledger incl. Dashboard.html, zero-code, node count, no-repo, demo data, returnAll, memory (T11), exports+push (T12). Not in scope by decision: DocType field, Tasks due date, Postgres chat memory — each is listed in the ledger with its reason.
- Type consistency: `OrderRequest`/`OrderResponse` defined in T10 step 3 and consumed in T10 steps 6–8; `searchFormula(fields, q)` defined in T7 and used in T7–T9; `FormState` imported from `entity-dialog` in T10 matches `leads/actions.ts`.
- Placeholders: none.
