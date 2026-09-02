# תפריט קטלוג ולידים בבוט הטלגרם — תוכנית ביצוע

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לקוח בבוט הלקוחות מדפדף בקטלוג בכפתורים (קטגוריה → מוצר → מפרט → "מעוניין"), הלחיצה יוצרת ליד ב-Airtable, מבקשת טלפון בלחיצה, יוצרת משימה ומודיעה לבעל העסק; טקסט חופשי ממשיך לסוכן ה-AI.

**Architecture:** WF5 מקבל צומת `Classify` (Code) שמנרמל כל עדכון טלגרם לפריט אחד עם `route`, ו-Switch שמנתב: callback / contact / start / skip / chat. מסלול התפריט: `Products` (Airtable) → `Render Menu` (Code, פונקציה טהורה) → עריכת ההודעה הקיימת או שליחת חדשה. כל המצב חי ב-`callback_data`. לוגיקת ה-Code יושבת בקבצים `n8n/code/*.js` עם בדיקות `node --test`, ומוזרקת ל-JSON של ה-workflow בייבוא דרך placeholder `__CODE_<NAME>__` (הרחבה של המנגנון הקיים לפרומפטים). Leads מקבל 4 שדות; WF2 מזהה כפילות לפי אימייל או טלפון.

**Tech Stack:** n8n (Telegram node v1.2, Telegram Trigger, Switch v3.4 rules, Airtable v2.2, HTTP Request v4.2, Code v2), Airtable Metadata API (bash+jq), Node 20 `node --test`, Next.js 15 + Vitest + zod באפליקציה, n8n MCP (`validate_node_config`, `get_workflow_details`, `prepare_workflow_pin_data`, `test_workflow`).

**Spec:** `docs/superpowers/specs/2026-09-02-telegram-catalog-menu-design.md`

## Global Constraints

- `Source` של ליד: `manual` / `telegram`. `Status` של ליד חדש: `New`. משימה: `Source=lead`, `RefId=<record id של הליד>`, `Title=לחזור ל{שם} — {מוצר}`.
- `callback_data` עד 64 בתים: `home`, `ask`, `cat:{קטגוריה עד 30 תווים}`, `p:{SKU}`, `lead:{SKU}`.
- קטגוריית שירותים: `שירותים` (זמין תמיד, בלי מלאי). מקסימום 10 מוצרים בקטגוריה. Highlights: עד 3 שורות.
- כל צומת טלגרם/Airtable/HTTP במסלול התפריט מסומן `"onError": "continueRegularOutput"` (הודעה שלא השתנתה, callback ישן, כשל Airtable) — אף כשל לא מפיל את הבוט.
- טקסט לטלגרם ב-HTML (`parse_mode: HTML`); שמות מוצרים מקודדים (`&`, `<`, `>`).
- placeholders: `__AIRTABLE_BASE_ID__`, `__TBL_LEADS__`, `__TBL_PRODUCTS__`, `__TBL_TASKS__`, `__CRED_AIRTABLE__`, `__CRED_TELEGRAM_CUSTOMER__`, `__CRED_TELEGRAM_MANAGER__`, `__OWNER_CHAT_ID__`, `__WF_SUPPORT_CORE_ID__`, `__WF_ERROR_ID__`, `__CODE_CLASSIFY__`, `__CODE_RENDER_MENU__`. הסקריפט `n8n/scripts/import-workflow.sh` ממלא אותם.
- קבצי `n8n/workflows/*.json` הם המקור. אין עריכה ב-UI של n8n. אחרי כל שינוי: ייבוא, `validate_node_config` על הצמתים החדשים, `get_workflow_details` לבדיקת `connections` (ה-MCP `validate_workflow` לא מאמת לפי workflowId).
- הוק `secret-guard` חוסם כל פקודת shell שמזכירה נתיב קובץ env. הסקריפטים ב-`airtable/` ו-`n8n/scripts/` טוענים env בעצמם.
- commits: `feat(n8n): …`, `feat(app): …`, `chore(airtable): …`, `docs: …`; trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. אין `git add -A`.
- ענף: `feat/telegram-catalog-menu` (כבר קיים, מבוסס על main).

---

## מבנה קבצים

| קובץ | אחריות |
|---|---|
| `airtable/add-fields.sh`, `verify-schema.sh`, `schema.md` (שינוי) | Leads: Phone, Source, Note, TelegramChatId |
| `app/src/lib/types.ts` (שינוי) | `LEAD_SOURCES`, `LeadSource`, `LeadFields` |
| `app/src/lib/lead-source.ts` + `.test.ts` (חדש) | `leadSourceLabel(source?)` |
| `app/src/app/(app)/leads/parse.ts` + `parse.test.ts` (שינוי) | טלפון אופציונלי, אימות פורמט ישראלי |
| `app/src/app/(app)/leads/page.tsx`, `actions.ts` (שינוי) | עמודות טלפון/מקור, שדה טלפון בטופס, `Source=manual` |
| `n8n/workflows/02-leads-dedupe.json` (שינוי) | כפילות לפי אימייל או טלפון |
| `n8n/scripts/import-workflow.sh` (שינוי) | הזרקת `__CODE_<NAME>__` מ-`n8n/code/*.js` |
| `n8n/code/classify.js` + `classify.test.js` (חדש) | נרמול עדכון טלגרם → route |
| `n8n/code/render-menu.js` + `render-menu.test.js` (חדש) | מסכי התפריט: טקסט + מקלדת |
| `n8n/workflows/05-customer-service.json` (שינוי) | ניתוב, תפריט, ליד, טלפון |
| `n8n/prompts/customer-service.md` (שינוי) | שורה על /menu |
| `docs/runbook.md`, `n8n/workflows/exported/` (שינוי) | תיעוד וייצוא |

---

### Task 1: סכימת Leads ב-Airtable

**Files:**
- Modify: `airtable/add-fields.sh`
- Modify: `airtable/verify-schema.sh` (השורות של `Leads.*`)
- Modify: `airtable/schema.md`

**Interfaces:**
- Produces: `Leads.Phone` (phoneNumber), `Leads.Source` (singleLineText), `Leads.Note` (multilineText), `Leads.TelegramChatId` (singleLineText).

- [ ] **Step 1: הוסף ל-add-fields.sh** (בסוף הקובץ):

```bash
add Leads Phone '{"name":"Phone","type":"phoneNumber"}'
add Leads Source '{"name":"Source","type":"singleLineText","description":"manual / telegram"}'
add Leads Note '{"name":"Note","type":"multilineText","description":"למשל: מתעניין ב{מוצר} ({SKU})"}'
add Leads TelegramChatId '{"name":"TelegramChatId","type":"singleLineText","description":"chat.id של הלקוח בטלגרם"}'
```

- [ ] **Step 2: הרץ** `bash airtable/add-fields.sh` — צפוי 4 שורות עם `fld…` (או `exists` בהרצה חוזרת).

- [ ] **Step 3: עדכן verify-schema.sh** — אחרי `Leads.Created:createdTime` הוסף:

```
Leads.Phone:phoneNumber
Leads.Source:singleLineText
Leads.Note:multilineText
Leads.TelegramChatId:singleLineText
```

- [ ] **Step 4: הרץ** `bash airtable/verify-schema.sh` — צפוי `schema OK`.

- [ ] **Step 5: עדכן schema.md** — בטבלה, אחרי שורת `Leads | Created`:

```markdown
| Leads | Phone | Phone number | אופציונלי. לידים מטלגרם מקבלים אותו אחרי "שתף טלפון" |
| Leads | Source | Single line text | manual / telegram |
| Leads | Note | Long text | הקשר: `מתעניין ב{מוצר} ({SKU})` |
| Leads | TelegramChatId | Single line text | chat.id בטלגרם, לחיבור הטלפון לליד |
```

ותקן את שורת `Leads | Status` ל-`New / Contacted / Qualified / Dead / Duplicate` (התיעוד הישן באותיות קטנות שגוי).

- [ ] **Step 6: Commit**

```bash
git add airtable/add-fields.sh airtable/verify-schema.sh airtable/schema.md
git commit -m "chore(airtable): Leads.Phone, Source, Note, TelegramChatId

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: לידים באפליקציה — טלפון, מקור, הערה

**Files:**
- Modify: `app/src/lib/types.ts:4,8,24`
- Create: `app/src/lib/lead-source.ts`, `app/src/lib/lead-source.test.ts`
- Modify: `app/src/app/(app)/leads/parse.ts`, `app/src/app/(app)/leads/parse.test.ts`
- Modify: `app/src/app/(app)/leads/page.tsx`, `app/src/app/(app)/leads/actions.ts`

**Interfaces:**
- Produces: `LEAD_SOURCES = ['manual','telegram'] as const`, `LeadSource`, `LeadFields` עם `Phone?`, `Source?`, `Note?`, `TelegramChatId?`; `leadSourceLabel(source?: string): string`; `parseLeadForm` מחזיר גם `Phone?: string`.

- [ ] **Step 1: בדיקה נכשלת ל-leadSourceLabel** — `app/src/lib/lead-source.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { leadSourceLabel } from './lead-source';

describe('leadSourceLabel', () => {
  it('maps sources to hebrew, defaults to manual', () => {
    expect(leadSourceLabel('telegram')).toBe('טלגרם');
    expect(leadSourceLabel('manual')).toBe('ידני');
    expect(leadSourceLabel(undefined)).toBe('ידני');
    expect(leadSourceLabel('weird')).toBe('weird');
  });
});
```

- [ ] **Step 2: הרץ** `cd app && pnpm vitest run src/lib/lead-source.test.ts` — צפוי FAIL (module not found).

- [ ] **Step 3: טיפוסים** — ב-`app/src/lib/types.ts`, אחרי `LEAD_STATUSES` הוסף `export const LEAD_SOURCES = ['manual', 'telegram'] as const;`, אחרי `LeadStatus` הוסף `export type LeadSource = (typeof LEAD_SOURCES)[number];`, והחלף את `LeadFields`:

```ts
export type LeadFields = {
  Name: string;
  Email?: string;
  Company?: string;
  Phone?: string;
  Status?: LeadStatus;
  Source?: LeadSource;
  Note?: string;
  TelegramChatId?: string;
  Created: string;
};
```

- [ ] **Step 4: lead-source.ts**

```ts
import type { LeadSource } from './types';

const LABEL: Record<LeadSource, string> = { manual: 'ידני', telegram: 'טלגרם' };

/** מאיפה הגיע הליד. חסר = ידני (לידים שנוצרו לפני השדה). */
export function leadSourceLabel(source?: string): string {
  if (!source) return LABEL.manual;
  return (LABEL as Record<string, string>)[source] ?? source;
}
```

- [ ] **Step 5: הרץ** את הבדיקה — צפוי PASS.

- [ ] **Step 6: בדיקות טלפון ב-parse.test.ts** — הוסף:

```ts
  it('accepts an israeli phone with or without dash and strips spaces', () => {
    const r = parseLeadForm(fd({ Name: 'דנה', Email: 'dana@example.com', Phone: '050 123 4567' }));
    expect(r.ok && r.data.Phone).toBe('0501234567');
    const r2 = parseLeadForm(fd({ Name: 'דנה', Email: 'dana@example.com', Phone: '03-1234567' }));
    expect(r2.ok && r2.data.Phone).toBe('03-1234567');
  });

  it('drops an empty phone and rejects a bad one', () => {
    const r = parseLeadForm(fd({ Name: 'דנה', Email: 'dana@example.com', Phone: '' }));
    expect(r.ok && r.data.Phone).toBeUndefined();
    const bad = parseLeadForm(fd({ Name: 'דנה', Email: 'dana@example.com', Phone: '12345' }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.Phone).toBe('טלפון לא תקין');
  });
```

עדכן את הבדיקה הראשונה הקיימת: ה-`toEqual` צריך לכלול `Phone: undefined`.

- [ ] **Step 7: הרץ** `pnpm vitest run "src/app/(app)/leads/parse.test.ts"` — צפוי FAIL (Phone לא בסכימה).

- [ ] **Step 8: parse.ts**

```ts
import { z } from 'zod';
import { parseForm, optionalText } from '@/lib/parse';

/** אותו פורמט כמו בקופה של החנות (WF10): 0 + 1–2 ספרות + מקף אופציונלי + 7 ספרות. */
const PHONE = /^0\d{1,2}-?\d{7}$/;

const schema = z.object({
  Name: z.string().trim().min(1, 'יש להזין שם'),
  Email: z.email('אימייל לא תקין').trim(),
  Company: z.unknown().transform(optionalText),
  Phone: z
    .unknown()
    .transform((v) => optionalText(v)?.replace(/\s/g, ''))
    .refine((v) => v === undefined || PHONE.test(v), 'טלפון לא תקין'),
});

export type LeadInput = z.infer<typeof schema>;
export const parseLeadForm = (fd: FormData) => parseForm(schema, fd, ['Name', 'Email', 'Company', 'Phone']);
```

- [ ] **Step 9: הרץ** את בדיקות parse — צפוי PASS.

- [ ] **Step 10: actions.ts** — ב-`createLead`, החלף `await erpCreate<LeadFields>('Leads', parsed.data);` ב-`await erpCreate<LeadFields>('Leads', { ...parsed.data, Source: 'manual' });`.

- [ ] **Step 11: page.tsx** — (א) import: `import { leadSourceLabel } from '@/lib/lead-source';`. (ב) בטופס, אחרי בלוק החברה:

```tsx
                <div className="space-y-2">
                  <Label htmlFor="lead-phone">טלפון</Label>
                  <Input id="lead-phone" name="Phone" type="tel" dir="ltr" placeholder="050-1234567" />
                  <FieldError name="Phone" />
                </div>
```

(ג) בטבלה: אחרי `<TableHead>אימייל</TableHead>` הוסף `<TableHead>טלפון</TableHead>` ו-`<TableHead>מקור</TableHead>`; בשורות, אחרי תא האימייל:

```tsx
                  <TableCell dir="ltr" className="num text-ink-2 text-end">
                    {l.fields.Phone ?? '—'}
                  </TableCell>
                  <TableCell className="text-ink-2">
                    {leadSourceLabel(l.fields.Source)}
                    {l.fields.Note && <span className="block text-xs text-ink-3">{l.fields.Note}</span>}
                  </TableCell>
```

- [ ] **Step 12: הרץ** `cd app && pnpm test && pnpm typecheck && pnpm lint` — הכל ירוק.

- [ ] **Step 13: Commit**

```bash
git add app/src/lib/types.ts app/src/lib/lead-source.ts app/src/lib/lead-source.test.ts "app/src/app/(app)/leads/parse.ts" "app/src/app/(app)/leads/parse.test.ts" "app/src/app/(app)/leads/page.tsx" "app/src/app/(app)/leads/actions.ts"
git commit -m "feat(app): lead phone, source and note

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: WF2 — כפילות לפי אימייל או טלפון

**Files:**
- Modify: `n8n/workflows/02-leads-dedupe.json` (צומת `Same Email`)

**Interfaces:**
- Consumes: הטריגר מחזיר `fields.Email?`, `fields.Phone?`.
- Produces: `Set Status` ללא שינוי (מסנן את הרשומה עצמה).

- [ ] **Step 1: החלף את הצומת `Same Email`** ב:

```json
{ "name": "Same Email Or Phone", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [260, 0],
  "parameters": { "method": "GET", "url": "https://api.airtable.com/v0/__AIRTABLE_BASE_ID__/__TBL_LEADS__", "authentication": "predefinedCredentialType", "nodeCredentialType": "airtableTokenApi",
    "sendQuery": true, "queryParameters": { "parameters": [
      { "name": "filterByFormula", "value": "={{ (() => { const q = (s) => String(s).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\'\"); const e = ($json.fields.Email || '').trim().toLowerCase(); const p = ($json.fields.Phone || '').replace(/\\s/g, ''); if (e) return \"LOWER({Email})='\" + q(e) + \"'\"; if (p) return \"{Phone}='\" + q(p) + \"'\"; return 'FALSE()'; })() }}" },
      { "name": "fields[]", "value": "Email" } ] }, "options": {} },
  "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } } }
```

ועדכן את `connections`: `"Airtable Trigger" → "Same Email Or Phone"`, `"Same Email Or Phone" → "Set Status"`. הערה ל-escaping: זה JSON; בתוך הביטוי, `\\\\` ב-JSON = `\\` ב-JS = backslash אחד ב-regex.

- [ ] **Step 2: יבא והפעל** — `n8n/scripts/import-workflow.sh n8n/workflows/02-leads-dedupe.json --activate`. `validate_node_config` על הצומת; `get_workflow_details` (id `sVCp9e8lWnx5kvrV`).

- [ ] **Step 3: בדיקה חיה** — צור ליד בלי אימייל עם טלפון דרך `bash airtable/api.sh POST /Leads '{"fields":{"Name":"בדיקת טלפון","Phone":"050-0000001","Source":"telegram"},"typecast":true}'`; תוך ~90 שניות `Status=New`. צור שני עם אותו טלפון → `Duplicate`. שלישי בלי אימייל ובלי טלפון → `New`. מחק את שלושתם (`api.sh DELETE /Leads/<id>`).

- [ ] **Step 4: Commit** `git add n8n/workflows/02-leads-dedupe.json n8n/config.json` (config רק אם השתנה) — `feat(n8n): WF2 dedupes by email or phone`.

---

### Task 4: קוד הצמתים כקבצים נבדקים + הזרקה בייבוא

**Files:**
- Modify: `n8n/scripts/import-workflow.sh`
- Create: `n8n/code/classify.js`, `n8n/code/classify.test.js`, `n8n/code/render-menu.js`, `n8n/code/render-menu.test.js`

**Interfaces:**
- Produces: `classify(update) → { route, chatId, messageId, queryId, data, text, contact, from:{id,name,username} }`; `renderMenu(data, products) → { action:'menu'|'lead', text, keyboard, product? }` כאשר `keyboard` בצורת ה-fixedCollection של צומת הטלגרם: `{ rows: [{ row: { buttons: [{ text, additionalFields: { callback_data } }] } }] }`. placeholders `__CODE_CLASSIFY__`, `__CODE_RENDER_MENU__`.

- [ ] **Step 1: הרחב את import-workflow.sh** — אחרי לולאת ה-prompts הוסף:

```bash
for c in code/*.js; do
  [ -e "$c" ] || continue
  case "$c" in *.test.js) continue ;; esac
  name=$(basename "$c" .js | tr 'a-z-' 'A-Z_')
  JQ_ARGS+=(--rawfile "c_$name" "$c")
  FILTER="$FILTER | gsub(\"__CODE_${name}__\"; (\$c_$name | rtrimstr(\"\\n\") | tojson | .[1:-1]))"
done
```

ועדכן את שורת התיעוד בראש הסקריפט: "ומקבצי code (`__CODE_NAME__`)". `mkdir -p n8n/code`.

- [ ] **Step 2: בדיקות classify** — `n8n/code/classify.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classify } = require('./classify.js');

const from = { id: 7, first_name: 'דנה', last_name: 'לוי', username: 'dana' };

test('callback query → callback route with data, messageId, queryId', () => {
  const r = classify({ callback_query: { id: 'q1', data: 'p:TY-HP-200', from, message: { message_id: 55, chat: { id: 7 } } } });
  assert.equal(r.route, 'callback');
  assert.deepEqual([r.chatId, r.messageId, r.queryId, r.data], ['7', 55, 'q1', 'p:TY-HP-200']);
  assert.equal(r.from.name, 'דנה לוי');
});

test('/start and /menu → start route with data home and no messageId', () => {
  for (const text of ['/start', '/menu', '/start abc']) {
    const r = classify({ message: { text, chat: { id: 7 }, from } });
    assert.equal(r.route, 'start');
    assert.equal(r.data, 'home');
    assert.equal(r.messageId, null);
  }
});

test('contact → contact route with phone', () => {
  const r = classify({ message: { contact: { phone_number: '+972501234567', first_name: 'דנה' }, chat: { id: 7 }, from } });
  assert.equal(r.route, 'contact');
  assert.equal(r.contact.phone_number, '+972501234567');
});

test('דלג → skip; other text → chat; name falls back to username', () => {
  assert.equal(classify({ message: { text: 'דלג', chat: { id: 7 }, from } }).route, 'skip');
  const r = classify({ message: { text: 'יש לכם מסכים?', chat: { id: 7 }, from: { id: 9, username: 'x' } } });
  assert.equal(r.route, 'chat');
  assert.equal(r.text, 'יש לכם מסכים?');
  assert.equal(r.from.name, 'x');
});
```

- [ ] **Step 3: הרץ** `node --test n8n/code/` — צפוי FAIL (module not found).

- [ ] **Step 4: classify.js**

```js
// classify.js — גוף צומת Code ב-WF5 (מוזרק כ-__CODE_CLASSIFY__). מנרמל עדכון טלגרם לפריט אחד.
// route: callback | contact | start | skip | chat. מחוץ ל-n8n הקובץ מייצא את הפונקציה לבדיקות.
function classify(u) {
  const cq = u.callback_query;
  const msg = u.message || (cq && cq.message) || {};
  const from = (cq && cq.from) || (u.message && u.message.from) || {};
  const text = String((u.message && u.message.text) || '').trim();
  let route = 'chat';
  if (cq) route = 'callback';
  else if (u.message && u.message.contact) route = 'contact';
  else if (/^\/(start|menu)\b/.test(text)) route = 'start';
  else if (text === 'דלג') route = 'skip';
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'לקוח טלגרם';
  return {
    route,
    chatId: String((msg.chat && msg.chat.id) || from.id || ''),
    messageId: cq && cq.message ? cq.message.message_id : null,
    queryId: cq ? cq.id : null,
    data: cq ? String(cq.data || 'home') : 'home',
    text,
    contact: (u.message && u.message.contact) || null,
    from: { id: from.id, name, username: from.username || null },
  };
}
if (typeof $input !== 'undefined') return [{ json: classify($input.first().json) }];
module.exports = { classify };
```

- [ ] **Step 5: הרץ** `node --test n8n/code/` — classify עובר.

- [ ] **Step 6: בדיקות render-menu** — `n8n/code/render-menu.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderMenu } = require('./render-menu.js');

const products = [
  { Name: 'מסך 27 אינץ\' TY-Vision', Sku: 'TY-MN-27Q', Category: 'מסכים', Price: 1290, Stock: 3, Highlights: 'פאנל IPS\n165Hz\nQHD\nרביעי לא נכנס' },
  { Name: 'כבל HDMI 2.1', Sku: 'TY-CB-HD21', Category: 'כבלים', Price: 59, Stock: 0, Highlights: 'HDMI 2.1' },
  { Name: 'תיקון מעבדה <בחנות>', Sku: 'TY-SRV-04', Category: 'שירותים', Price: 149, Highlights: '' },
];
const buttons = (k) => k.rows.map((r) => r.row.buttons.map((b) => [b.text, b.additionalFields.callback_data]));

test('home lists categories alphabetically plus free question', () => {
  const m = renderMenu('home', products);
  assert.equal(m.action, 'menu');
  assert.deepEqual(buttons(m.keyboard), [[['כבלים', 'cat:כבלים']], [['מסכים', 'cat:מסכים']], [['שירותים', 'cat:שירותים']], [['שאלה חופשית', 'ask']]]);
});

test('category lists products with price, marks out of stock, has back', () => {
  const m = renderMenu('cat:כבלים', products);
  assert.deepEqual(buttons(m.keyboard), [[['כבל HDMI 2.1 · 59 ₪ (אזל)', 'p:TY-CB-HD21']], [['חזרה', 'home']]]);
});

test('product shows sku, price, up to 3 highlights, stock line, and buttons', () => {
  const m = renderMenu('p:TY-MN-27Q', products);
  assert.equal(m.text, '<b>מסך 27 אינץ\' TY-Vision</b>\nTY-MN-27Q · 1,290 ₪\n• פאנל IPS\n• 165Hz\n• QHD\nבמלאי');
  assert.deepEqual(buttons(m.keyboard), [[['מעוניין', 'lead:TY-MN-27Q']], [['חזרה לקטגוריה', 'cat:מסכים'], ['תפריט ראשי', 'home']]]);
  assert.deepEqual(m.product, { name: 'מסך 27 אינץ\' TY-Vision', sku: 'TY-MN-27Q' });
});

test('service is always available and html is escaped', () => {
  const m = renderMenu('p:TY-SRV-04', products);
  assert.ok(m.text.startsWith('<b>תיקון מעבדה &lt;בחנות&gt;</b>'));
  assert.ok(m.text.endsWith('שירות — זמין תמיד'));
});

test('lead action carries the product and a home button', () => {
  const m = renderMenu('lead:TY-CB-HD21', products);
  assert.equal(m.action, 'lead');
  assert.equal(m.text, 'מעולה, רשמנו שאתם מתעניינים בכבל HDMI 2.1.');
  assert.deepEqual(m.product, { name: 'כבל HDMI 2.1', sku: 'TY-CB-HD21' });
});

test('unknown sku or category falls back to home with a note', () => {
  assert.equal(renderMenu('p:NOPE', products).text, 'המוצר כבר לא זמין.');
  assert.equal(renderMenu('cat:אין', products).text, 'הקטגוריה כבר לא זמינה.');
  assert.equal(renderMenu('ask', products).text, 'כתבו כאן כל שאלה ונענה מיד.');
});

test('callback_data stays within 64 bytes for long category names', () => {
  const long = { Name: 'x', Sku: 'X-1', Category: 'קטגוריה עם שם ארוך מאוד שחורג ממגבלת הבתים של טלגרם', Price: 1, Stock: 1 };
  const m = renderMenu('home', [long]);
  const data = m.keyboard.rows[0].row.buttons[0].additionalFields.callback_data;
  assert.ok(Buffer.byteLength(data, 'utf8') <= 64);
  assert.equal(renderMenu(data, [long]).keyboard.rows[0].row.buttons[0].additionalFields.callback_data, 'p:X-1');
});
```

- [ ] **Step 7: הרץ** — FAIL (module not found).

- [ ] **Step 8: render-menu.js**

```js
// render-menu.js — גוף צומת Code ב-WF5 (מוזרק כ-__CODE_RENDER_MENU__). קלט: callback_data + כל המוצרים.
// פלט: { action: 'menu' | 'lead', text (HTML), keyboard (צורת inlineKeyboard של צומת הטלגרם), product? }.
const SERVICE = 'שירותים';
const MAX_CAT = 30; // callback_data ≤ 64 בתים; עברית = 2 בתים לתו, 'cat:' = 4
const MAX_LIST = 10;
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const price = (n) => Number(n || 0).toLocaleString('he-IL') + ' ₪';
const btn = (text, data) => ({ text, additionalFields: { callback_data: data } });
const keyboard = (...lines) => ({ rows: lines.map((buttons) => ({ row: { buttons } })) });
const catKey = (c) => 'cat:' + String(c).slice(0, MAX_CAT);

function renderMenu(data, products) {
  const items = products
    .filter((p) => p && p.Sku)
    .map((p) => ({
      name: p.Name, sku: p.Sku, category: p.Category || 'אחר', price: p.Price,
      stock: Number(p.Stock) || 0, service: p.Category === SERVICE,
      highlights: String(p.Highlights || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 3),
    }));
  const cats = [...new Set(items.map((i) => i.category))].sort((a, b) => a.localeCompare(b, 'he'));
  const home = (text) => ({ action: 'menu', text: text || 'במה תרצו להתעניין?', keyboard: keyboard(...cats.map((c) => [btn(c, catKey(c))]), [btn('שאלה חופשית', 'ask')]) });
  const d = String(data || 'home');
  if (d === 'home') return home();
  if (d === 'ask') return { action: 'menu', text: 'כתבו כאן כל שאלה ונענה מיד.', keyboard: keyboard([btn('תפריט ראשי', 'home')]) };
  if (d.startsWith('cat:')) {
    const cat = cats.find((c) => catKey(c) === d);
    if (!cat) return home('הקטגוריה כבר לא זמינה.');
    const list = items.filter((i) => i.category === cat).slice(0, MAX_LIST);
    const label = (i) => `${i.name} · ${price(i.price)}${!i.service && i.stock <= 0 ? ' (אזל)' : ''}`;
    return { action: 'menu', text: `<b>${esc(cat)}</b>`, keyboard: keyboard(...list.map((i) => [btn(label(i), 'p:' + i.sku)]), [btn('חזרה', 'home')]) };
  }
  const sku = d.startsWith('p:') ? d.slice(2) : d.startsWith('lead:') ? d.slice(5) : null;
  const item = sku ? items.find((i) => i.sku === sku) : null;
  if (!item) return home('המוצר כבר לא זמין.');
  const product = { name: item.name, sku: item.sku };
  if (d.startsWith('lead:')) return { action: 'lead', text: `מעולה, רשמנו שאתם מתעניינים ב${esc(item.name)}.`, keyboard: keyboard([btn('תפריט ראשי', 'home')]), product };
  const stock = item.service ? 'שירות — זמין תמיד' : item.stock > 0 ? 'במלאי' : 'אזל מהמלאי';
  const text = [`<b>${esc(item.name)}</b>`, `${esc(item.sku)} · ${price(item.price)}`, ...item.highlights.map((h) => `• ${esc(h)}`), stock].join('\n');
  return { action: 'menu', text, keyboard: keyboard([btn('מעוניין', 'lead:' + item.sku)], [btn('חזרה לקטגוריה', catKey(item.category)), btn('תפריט ראשי', 'home')]), product };
}
if (typeof $input !== 'undefined') return [{ json: renderMenu($('Classify').first().json.data, $input.all().map((i) => (i.json && i.json.fields) || i.json)) }];
module.exports = { renderMenu };
```

הערה: `toLocaleString('he-IL')` ב-Node של n8n (Docker) חייב ICU מלא; אם הבדיקה של `1,290 ₪` נכשלת עם `1290`, החלף ב-`String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, ',')` ועדכן את הפונקציה — לא את הבדיקה.

- [ ] **Step 9: הרץ** `node --test n8n/code/` — כל הבדיקות עוברות.

- [ ] **Step 10: אימות ההזרקה** — צור זמנית קובץ `n8n/workflows/zz-probe.json` עם `{"name":"probe","nodes":[{"name":"C","type":"n8n-nodes-base.code","typeVersion":2,"position":[0,0],"parameters":{"jsCode":"__CODE_CLASSIFY__"}}],"connections":{}}`, הרץ את החלק של ה-jq בלבד: `cd n8n && jq -n --rawfile tpl workflows/zz-probe.json --rawfile c_CLASSIFY code/classify.js '$tpl | gsub("__CODE_CLASSIFY__"; ($c_CLASSIFY | rtrimstr("\n") | tojson | .[1:-1])) | fromjson | .nodes[0].parameters.jsCode' | head -c 300` — צפוי להדפיס את תחילת הקוד כמחרוזת תקינה. מחק את קובץ ה-probe. (לא לייבא אותו.)

- [ ] **Step 11: Commit**

```bash
git add n8n/scripts/import-workflow.sh n8n/code/
git commit -m "feat(n8n): code files injected into workflows, classify + render-menu with tests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: WF5 — ניתוב ותפריט דפדוף

**Files:**
- Modify: `n8n/workflows/05-customer-service.json` (שכתוב הצמתים; `Support Core` ו-`Send Reply` נשארים)

**Interfaces:**
- Consumes: `__CODE_CLASSIFY__`, `__CODE_RENDER_MENU__` (Task 4).
- Produces: צמתים `Classify`, `Route`, `Answer Callback`, `Products`, `Render Menu`, `Is Lead?`, `Edit or Send?`, `Edit Menu`, `Send Menu`. הענף `lead` של `Is Lead?` נשאר לא מחובר עד Task 6.

- [ ] **Step 1: כתוב את ה-JSON החדש.** החלף את הקובץ כולו ב:

```json
{
  "name": "WF5 — סוכן שירות לקוחות",
  "settings": { "executionOrder": "v1", "errorWorkflow": "__WF_ERROR_ID__" },
  "nodes": [
    { "name": "Telegram Trigger", "type": "n8n-nodes-base.telegramTrigger", "typeVersion": 1.2, "position": [0, 200],
      "parameters": { "updates": ["message", "callback_query"], "additionalFields": {} },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_CUSTOMER__", "name": "Telegram Customer" } } },
    { "name": "Classify", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [260, 200],
      "parameters": { "mode": "runOnceForAllItems", "jsCode": "__CODE_CLASSIFY__" } },
    { "name": "Route", "type": "n8n-nodes-base.switch", "typeVersion": 3.4, "position": [520, 200],
      "parameters": { "mode": "rules", "rules": { "values": [
        { "renameOutput": true, "outputKey": "callback", "conditions": { "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "strict", "version": 2 }, "conditions": [ { "id": "r1", "leftValue": "={{ $json.route }}", "rightValue": "callback", "operator": { "type": "string", "operation": "equals" } } ], "combinator": "and" } },
        { "renameOutput": true, "outputKey": "contact", "conditions": { "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "strict", "version": 2 }, "conditions": [ { "id": "r2", "leftValue": "={{ $json.route }}", "rightValue": "contact", "operator": { "type": "string", "operation": "equals" } } ], "combinator": "and" } },
        { "renameOutput": true, "outputKey": "start", "conditions": { "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "strict", "version": 2 }, "conditions": [ { "id": "r3", "leftValue": "={{ $json.route }}", "rightValue": "start", "operator": { "type": "string", "operation": "equals" } } ], "combinator": "and" } },
        { "renameOutput": true, "outputKey": "skip", "conditions": { "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "strict", "version": 2 }, "conditions": [ { "id": "r4", "leftValue": "={{ $json.route }}", "rightValue": "skip", "operator": { "type": "string", "operation": "equals" } } ], "combinator": "and" } }
      ] }, "options": { "fallbackOutput": "extra", "renameFallbackOutput": "chat" } } },
    { "name": "Answer Callback", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [780, 0],
      "parameters": { "resource": "callback", "operation": "answerQuery", "queryId": "={{ $json.queryId }}", "additionalFields": {} },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_CUSTOMER__", "name": "Telegram Customer" } },
      "onError": "continueRegularOutput" },
    { "name": "Products", "type": "n8n-nodes-base.airtable", "typeVersion": 2.2, "position": [1040, 100],
      "parameters": { "authentication": "airtableTokenApi", "operation": "search", "base": { "__rl": true, "mode": "id", "value": "__AIRTABLE_BASE_ID__" }, "table": { "__rl": true, "mode": "id", "value": "__TBL_PRODUCTS__" }, "filterByFormula": "", "returnAll": true, "options": {} },
      "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
      "alwaysOutputData": true, "onError": "continueRegularOutput" },
    { "name": "Render Menu", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1300, 100],
      "parameters": { "mode": "runOnceForAllItems", "jsCode": "__CODE_RENDER_MENU__" } },
    { "name": "Is Lead?", "type": "n8n-nodes-base.if", "typeVersion": 2.3, "position": [1560, 100],
      "parameters": { "conditions": { "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "loose", "version": 2 }, "conditions": [ { "id": "l1", "leftValue": "={{ $json.action }}", "rightValue": "lead", "operator": { "type": "string", "operation": "equals" } } ], "combinator": "and" }, "looseTypeValidation": true, "options": {} } },
    { "name": "Edit or Send?", "type": "n8n-nodes-base.if", "typeVersion": 2.3, "position": [1820, 200],
      "parameters": { "conditions": { "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "loose", "version": 2 }, "conditions": [ { "id": "e1", "leftValue": "={{ $('Classify').first().json.messageId !== null }}", "rightValue": true, "operator": { "type": "boolean", "operation": "true", "singleValue": true } } ], "combinator": "and" }, "looseTypeValidation": true, "options": {} } },
    { "name": "Edit Menu", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [2080, 100],
      "parameters": { "resource": "message", "operation": "editMessageText", "messageType": "message", "chatId": "={{ $('Classify').first().json.chatId }}", "messageId": "={{ $('Classify').first().json.messageId }}", "replyMarkup": "inlineKeyboard", "inlineKeyboard": "={{ $json.keyboard }}", "text": "={{ $json.text }}", "additionalFields": { "parse_mode": "HTML" } },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_CUSTOMER__", "name": "Telegram Customer" } },
      "onError": "continueRegularOutput" },
    { "name": "Send Menu", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [2080, 300],
      "parameters": { "resource": "message", "operation": "sendMessage", "chatId": "={{ $('Classify').first().json.chatId }}", "replyMarkup": "inlineKeyboard", "inlineKeyboard": "={{ $json.keyboard }}", "text": "={{ $json.text }}", "additionalFields": { "appendAttribution": false, "parse_mode": "HTML" } },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_CUSTOMER__", "name": "Telegram Customer" } },
      "onError": "continueRegularOutput" },
    { "name": "Chat Input", "type": "n8n-nodes-base.set", "typeVersion": 3.4, "position": [780, 600],
      "parameters": { "assignments": { "assignments": [
        { "id": "m", "name": "message", "value": "={{ $json.text }}", "type": "string" },
        { "id": "s", "name": "sessionId", "value": "=tg-{{ $json.chatId }}", "type": "string" }
      ] }, "options": {} } },
    { "name": "Support Core", "type": "n8n-nodes-base.executeWorkflow", "typeVersion": 1.2, "position": [1040, 600],
      "parameters": { "workflowId": { "__rl": true, "mode": "id", "value": "__WF_SUPPORT_CORE_ID__" },
        "workflowInputs": { "mappingMode": "defineBelow", "value": { "message": "={{ $json.message }}", "sessionId": "={{ $json.sessionId }}" }, "matchingColumns": [],
          "schema": [ { "id": "message", "displayName": "message", "required": false, "defaultMatch": false, "display": true, "canBeUsedToMatch": true, "type": "string" }, { "id": "sessionId", "displayName": "sessionId", "required": false, "defaultMatch": false, "display": true, "canBeUsedToMatch": true, "type": "string" } ] },
        "options": { "waitForSubWorkflow": true } } },
    { "name": "Send Reply", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [1300, 600],
      "parameters": { "chatId": "={{ $('Classify').first().json.chatId }}", "text": "={{ ($json.reply || 'מצטערים, לא הצלחנו לענות כרגע.').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }}", "additionalFields": { "appendAttribution": false, "parse_mode": "HTML" } },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_CUSTOMER__", "name": "Telegram Customer" } } }
  ],
  "connections": {
    "Telegram Trigger": { "main": [[{ "node": "Classify", "type": "main", "index": 0 }]] },
    "Classify": { "main": [[{ "node": "Route", "type": "main", "index": 0 }]] },
    "Route": { "main": [
      [{ "node": "Answer Callback", "type": "main", "index": 0 }],
      [],
      [{ "node": "Products", "type": "main", "index": 0 }],
      [],
      [{ "node": "Chat Input", "type": "main", "index": 0 }]
    ] },
    "Answer Callback": { "main": [[{ "node": "Products", "type": "main", "index": 0 }]] },
    "Products": { "main": [[{ "node": "Render Menu", "type": "main", "index": 0 }]] },
    "Render Menu": { "main": [[{ "node": "Is Lead?", "type": "main", "index": 0 }]] },
    "Is Lead?": { "main": [ [], [{ "node": "Edit or Send?", "type": "main", "index": 0 }] ] },
    "Edit or Send?": { "main": [ [{ "node": "Edit Menu", "type": "main", "index": 0 }], [{ "node": "Send Menu", "type": "main", "index": 0 }] ] },
    "Chat Input": { "main": [[{ "node": "Support Core", "type": "main", "index": 0 }]] },
    "Support Core": { "main": [[{ "node": "Send Reply", "type": "main", "index": 0 }]] }
  }
}
```

הערות:
- `Route` בסדר יציאות: 0 callback, 1 contact (ריק עד Task 6), 2 start, 3 skip (ריק עד Task 6), 4 chat (fallback).
- `Is Lead?` יציאה 0 (true) ריקה עד Task 6.
- `inlineKeyboard` מקבל ביטוי שמחזיר אובייקט בצורת ה-fixedCollection. אם `validate_node_config` או ההרצה דוחים ביטוי על הפרמטר הזה, **תוכנית חלופית** (לא לנחש, לבדוק): צומת HTTP Request `POST https://api.telegram.org/bot{{ $credentials }}`-לא זמין; במקום זה צומת `Telegram` עם `replyMarkup: inlineKeyboard` ו-`inlineKeyboard.rows` כביטוי `={{ $json.keyboard.rows }}`. אם גם זה נדחה — HTTP Request עם `predefinedCredentialType`/`telegramApi` ל-`sendMessage`/`editMessageText` עם `reply_markup` כ-JSON מה-`Render Menu` (הצורה של Bot API: `{ inline_keyboard: [[{text, callback_data}]] }`), ו-`Render Menu` יחזיר גם `replyMarkup` בצורה הזו. דווח איזו חלופה נבחרה.

- [ ] **Step 2: ייבוא ואימות** — `n8n/scripts/import-workflow.sh n8n/workflows/05-customer-service.json --activate` (id `GGC2TpFYltm7DrWF`). `validate_node_config` על Route, Answer Callback, Edit Menu, Send Menu. `get_workflow_details`: ה-`jsCode` של Classify ו-Render Menu מכיל את הקוד (לא placeholder), `connections["Route"].main` עם 5 יציאות.

- [ ] **Step 3: בדיקת pin data** — `prepare_workflow_pin_data` ואז `test_workflow` פעמיים: (א) Telegram Trigger מוצמד ל-`{ "message": { "text": "/start", "chat": { "id": 1 }, "from": { "id": 1, "first_name": "בדיקה" } } }` ו-Products מוצמד ל-3 מוצרים (`{ id, fields: { Name, Sku, Category, Price, Stock, Highlights } }`) — צפוי: Route → start → Products → Render Menu (פלט: `action: menu`, כפתורי קטגוריות) → Is Lead? false → Edit or Send? false → Send Menu. (ב) trigger מוצמד ל-`callback_query` עם `data: "p:<SKU>"`, `message.message_id: 5` — צפוי: Answer Callback → … → Edit Menu, טקסט המוצר עם 3 תבליטים. דווח את פלט Render Menu משתי ההרצות.

- [ ] **Step 4: בדיקה אנושית** — בטלגרם, `@aielec_support_bot`: `/start` → כפתורי קטגוריות → קטגוריה → מוצר → מפרט → "חזרה לקטגוריה" → "תפריט ראשי" → "שאלה חופשית" → טקסט חופשי עונה הסוכן. הבודק האנושי מדווח מה ראה. (הסוכן המבצע לא יכול ללחוץ בטלגרם — לדווח DONE_WITH_CONCERNS עם רשימת הבדיקה לאדם.)

- [ ] **Step 5: Commit** `git add n8n/workflows/05-customer-service.json n8n/config.json` — `feat(n8n): WF5 catalog menu with inline keyboard, routes free text to the agent`.

---

### Task 6: WF5 — ליד, טלפון, דלג

**Files:**
- Modify: `n8n/workflows/05-customer-service.json`

**Interfaces:**
- Consumes: `Render Menu` (`action: lead`, `product`), `Classify` (`chatId`, `from`, `contact`).
- Produces: מסלולי lead / contact / skip; ליד ב-Airtable, משימה, הודעות לבעל העסק.

- [ ] **Step 1: הוסף צמתים** (ל-`nodes`):

```json
    { "name": "Lead Exists?", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [1820, -100],
      "parameters": { "method": "GET", "url": "https://api.airtable.com/v0/__AIRTABLE_BASE_ID__/__TBL_LEADS__", "authentication": "predefinedCredentialType", "nodeCredentialType": "airtableTokenApi",
        "sendQuery": true, "queryParameters": { "parameters": [
          { "name": "filterByFormula", "value": "={{ \"AND({TelegramChatId}='\" + $('Classify').first().json.chatId + \"', {Status}='New', FIND('\" + $json.product.sku + \"', {Note}))\" }}" },
          { "name": "maxRecords", "value": "1" } ] }, "options": { "timeout": 20000 } },
      "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
      "onError": "continueRegularOutput" },
    { "name": "Has Lead?", "type": "n8n-nodes-base.if", "typeVersion": 2.3, "position": [2080, -100],
      "parameters": { "conditions": { "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "loose", "version": 2 }, "conditions": [ { "id": "h1", "leftValue": "={{ ($json.records || []).length }}", "rightValue": 0, "operator": { "type": "number", "operation": "gt" } } ], "combinator": "and" }, "looseTypeValidation": true, "options": {} } },
    { "name": "Create Lead", "type": "n8n-nodes-base.airtable", "typeVersion": 2.2, "position": [2340, 0],
      "parameters": { "authentication": "airtableTokenApi", "operation": "create",
        "base": { "__rl": true, "mode": "id", "value": "__AIRTABLE_BASE_ID__" }, "table": { "__rl": true, "mode": "id", "value": "__TBL_LEADS__" },
        "columns": { "mappingMode": "defineBelow", "value": {
            "Name": "={{ $('Classify').first().json.from.name }}",
            "Status": "New", "Source": "telegram",
            "Note": "=מתעניין ב{{ $('Render Menu').first().json.product.name }} ({{ $('Render Menu').first().json.product.sku }})",
            "TelegramChatId": "={{ $('Classify').first().json.chatId }}" },
          "matchingColumns": [], "schema": [
            { "id": "Name", "displayName": "Name", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
            { "id": "Status", "displayName": "Status", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
            { "id": "Source", "displayName": "Source", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
            { "id": "Note", "displayName": "Note", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
            { "id": "TelegramChatId", "displayName": "TelegramChatId", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false } ] },
        "options": { "typecast": true } },
      "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
      "onError": "continueRegularOutput" },
    { "name": "Create Task", "type": "n8n-nodes-base.airtable", "typeVersion": 2.2, "position": [2600, 0],
      "parameters": { "authentication": "airtableTokenApi", "operation": "create",
        "base": { "__rl": true, "mode": "id", "value": "__AIRTABLE_BASE_ID__" }, "table": { "__rl": true, "mode": "id", "value": "__TBL_TASKS__" },
        "columns": { "mappingMode": "defineBelow", "value": {
            "Title": "=לחזור ל{{ $('Classify').first().json.from.name }} — {{ $('Render Menu').first().json.product.name }}",
            "Status": "open", "Source": "lead", "RefId": "={{ $json.id }}" },
          "matchingColumns": [], "schema": [
            { "id": "Title", "displayName": "Title", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
            { "id": "Status", "displayName": "Status", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
            { "id": "Source", "displayName": "Source", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
            { "id": "RefId", "displayName": "RefId", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false } ] },
        "options": { "typecast": true } },
      "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
      "onError": "continueRegularOutput" },
    { "name": "Notify Owner", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [2860, 0],
      "parameters": { "chatId": "__OWNER_CHAT_ID__", "text": "=📞 ליד חדש מטלגרם\n{{ $('Classify').first().json.from.name }}{{ $('Classify').first().json.from.username ? ' (@' + $('Classify').first().json.from.username + ')' : '' }} · {{ $('Render Menu').first().json.product.name }} {{ $('Render Menu').first().json.product.sku }}\nטלפון: יתעדכן אם ישותף", "additionalFields": { "appendAttribution": false } },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_MANAGER__", "name": "Telegram Manager" } },
      "onError": "continueRegularOutput" },
    { "name": "Confirm Lead", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [3120, -100],
      "parameters": { "resource": "message", "operation": "editMessageText", "messageType": "message", "chatId": "={{ $('Classify').first().json.chatId }}", "messageId": "={{ $('Classify').first().json.messageId }}", "replyMarkup": "inlineKeyboard", "inlineKeyboard": "={{ $('Render Menu').first().json.keyboard }}", "text": "={{ $('Render Menu').first().json.text }}", "additionalFields": { "parse_mode": "HTML" } },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_CUSTOMER__", "name": "Telegram Customer" } },
      "onError": "continueRegularOutput" },
    { "name": "Ask Phone", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [3380, -100],
      "parameters": { "resource": "message", "operation": "sendMessage", "chatId": "={{ $('Classify').first().json.chatId }}", "text": "כדי שנחזור אליכם, שתפו טלפון בלחיצה אחת או דלגו.", "replyMarkup": "replyKeyboard",
        "replyKeyboard": { "rows": [ { "row": { "buttons": [ { "text": "שתף טלפון", "additionalFields": { "request_contact": true } } ] } }, { "row": { "buttons": [ { "text": "דלג", "additionalFields": {} } ] } } ] },
        "replyKeyboardOptions": { "resize_keyboard": true, "one_time_keyboard": true },
        "additionalFields": { "appendAttribution": false } },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_CUSTOMER__", "name": "Telegram Customer" } },
      "onError": "continueRegularOutput" },
    { "name": "Find Lead", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [780, 400],
      "parameters": { "method": "GET", "url": "https://api.airtable.com/v0/__AIRTABLE_BASE_ID__/__TBL_LEADS__", "authentication": "predefinedCredentialType", "nodeCredentialType": "airtableTokenApi",
        "sendQuery": true, "queryParameters": { "parameters": [
          { "name": "filterByFormula", "value": "={{ \"{TelegramChatId}='\" + $json.chatId + \"'\" }}" },
          { "name": "sort[0][field]", "value": "Created" }, { "name": "sort[0][direction]", "value": "desc" },
          { "name": "maxRecords", "value": "1" } ] }, "options": { "timeout": 20000 } },
      "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
      "onError": "continueRegularOutput" },
    { "name": "Found Lead?", "type": "n8n-nodes-base.if", "typeVersion": 2.3, "position": [1040, 400],
      "parameters": { "conditions": { "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "loose", "version": 2 }, "conditions": [ { "id": "f1", "leftValue": "={{ ($json.records || []).length }}", "rightValue": 0, "operator": { "type": "number", "operation": "gt" } } ], "combinator": "and" }, "looseTypeValidation": true, "options": {} } },
    { "name": "Update Lead Phone", "type": "n8n-nodes-base.airtable", "typeVersion": 2.2, "position": [1300, 350],
      "parameters": { "authentication": "airtableTokenApi", "operation": "update",
        "base": { "__rl": true, "mode": "id", "value": "__AIRTABLE_BASE_ID__" }, "table": { "__rl": true, "mode": "id", "value": "__TBL_LEADS__" },
        "columns": { "mappingMode": "defineBelow", "value": { "id": "={{ $json.records[0].id }}", "Phone": "={{ $('Classify').first().json.contact.phone_number }}" }, "matchingColumns": ["id"],
          "schema": [ { "id": "id", "displayName": "id", "required": false, "defaultMatch": true, "display": true, "type": "string", "readOnly": true, "removed": false }, { "id": "Phone", "displayName": "Phone", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false } ] },
        "options": { "typecast": true } },
      "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
      "onError": "continueRegularOutput" },
    { "name": "Notify Owner Phone", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [1560, 350],
      "parameters": { "chatId": "__OWNER_CHAT_ID__", "text": "=📞 טלפון לליד {{ $('Classify').first().json.from.name }}: {{ $('Classify').first().json.contact.phone_number }}", "additionalFields": { "appendAttribution": false } },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_MANAGER__", "name": "Telegram Manager" } },
      "onError": "continueRegularOutput" },
    { "name": "Thanks", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [1820, 400],
      "parameters": { "resource": "message", "operation": "sendMessage", "chatId": "={{ $('Classify').first().json.chatId }}", "text": "=תודה {{ $('Classify').first().json.from.name }}, נחזור אליכם בקרוב.", "replyMarkup": "replyKeyboardRemove", "replyKeyboardRemove": { "remove_keyboard": true }, "additionalFields": { "appendAttribution": false } },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_CUSTOMER__", "name": "Telegram Customer" } },
      "onError": "continueRegularOutput" },
    { "name": "Skip Ack", "type": "n8n-nodes-base.telegram", "typeVersion": 1.2, "position": [780, 500],
      "parameters": { "resource": "message", "operation": "sendMessage", "chatId": "={{ $json.chatId }}", "text": "בסדר, נחזור אליכם בטלגרם.", "replyMarkup": "replyKeyboardRemove", "replyKeyboardRemove": { "remove_keyboard": true }, "additionalFields": { "appendAttribution": false } },
      "credentials": { "telegramApi": { "id": "__CRED_TELEGRAM_CUSTOMER__", "name": "Telegram Customer" } },
      "onError": "continueRegularOutput" }
```

- [ ] **Step 2: חיבורים** — עדכן/הוסף:

```json
    "Route": { "main": [
      [{ "node": "Answer Callback", "type": "main", "index": 0 }],
      [{ "node": "Find Lead", "type": "main", "index": 0 }],
      [{ "node": "Products", "type": "main", "index": 0 }],
      [{ "node": "Skip Ack", "type": "main", "index": 0 }],
      [{ "node": "Chat Input", "type": "main", "index": 0 }]
    ] },
    "Is Lead?": { "main": [ [{ "node": "Lead Exists?", "type": "main", "index": 0 }], [{ "node": "Edit or Send?", "type": "main", "index": 0 }] ] },
    "Lead Exists?": { "main": [[{ "node": "Has Lead?", "type": "main", "index": 0 }]] },
    "Has Lead?": { "main": [ [{ "node": "Confirm Lead", "type": "main", "index": 0 }], [{ "node": "Create Lead", "type": "main", "index": 0 }] ] },
    "Create Lead": { "main": [[{ "node": "Create Task", "type": "main", "index": 0 }]] },
    "Create Task": { "main": [[{ "node": "Notify Owner", "type": "main", "index": 0 }]] },
    "Notify Owner": { "main": [[{ "node": "Confirm Lead", "type": "main", "index": 0 }]] },
    "Confirm Lead": { "main": [[{ "node": "Ask Phone", "type": "main", "index": 0 }]] },
    "Find Lead": { "main": [[{ "node": "Found Lead?", "type": "main", "index": 0 }]] },
    "Found Lead?": { "main": [ [{ "node": "Update Lead Phone", "type": "main", "index": 0 }], [{ "node": "Thanks", "type": "main", "index": 0 }] ] },
    "Update Lead Phone": { "main": [[{ "node": "Notify Owner Phone", "type": "main", "index": 0 }]] },
    "Notify Owner Phone": { "main": [[{ "node": "Thanks", "type": "main", "index": 0 }]] },
    "Thanks": { "main": [[{ "node": "Products", "type": "main", "index": 0 }]] },
    "Skip Ack": { "main": [[{ "node": "Products", "type": "main", "index": 0 }]] }
```

`Thanks` ו-`Skip Ack` מובילים ל-`Products` כדי להציג את הבית מחדש; `Classify` במסלולים האלה נותן `data: home`, `messageId: null`, ולכן `Edit or Send?` שולח הודעה חדשה.

- [ ] **Step 3: ייבוא ואימות** כמו ב-Task 5. `validate_node_config` על כל הצמתים החדשים. `get_workflow_details`: כל 5 יציאות `Route` מחוברות, `Is Lead?` שתי יציאות, `Thanks`/`Skip Ack` → `Products`.

- [ ] **Step 4: pin-data** — `test_workflow` עם callback `lead:<SKU>` ו-`Lead Exists?` מוצמד ל-`{ records: [] }`: צפוי Create Lead → Create Task → Notify Owner → Confirm Lead → Ask Phone (מוצמדים, אבל הסדר וה-expressions שהתקבלו נבדקים בפלט). ועם `message.contact` + `Find Lead` מוצמד לרשומה: Update Lead Phone → Notify Owner Phone → Thanks → Products → … → Send Menu.

- [ ] **Step 5: בדיקה אנושית** — מוצר → "מעוניין" → "שתף טלפון". אימות: `bash airtable/show-records.sh Leads "{Source}='telegram'"` מציג ליד עם Phone, Note, TelegramChatId, Status `New` (WF2 עבד); `show-records.sh Tasks "{Source}='lead'"` מציג משימה; בעל העסק קיבל שתי הודעות; לחיצה שנייה על "מעוניין" לאותו מוצר לא יוצרת ליד שני. אחר כך "דלג" מסיר את המקלדת ומראה את הבית. הבודק האנושי מדווח.

- [ ] **Step 6: Commit** — `feat(n8n): WF5 creates leads from the menu, collects phone, notifies the owner`.

---

### Task 7: פרומפט, תיעוד, ייצוא

**Files:**
- Modify: `n8n/prompts/customer-service.md`, `docs/runbook.md`, `n8n/workflows/exported/*`

- [ ] **Step 1: פרומפט** — בסוף `customer-service.md` הוסף שורה: `אם הלקוח רוצה שיחזרו אליו או מבקש הצעת מחיר, הפנה אותו בטלגרם לכתוב /menu, לבחור מוצר וללחוץ "מעוניין" — כך נשמרים הפרטים שלו. באתר: להשאיר שם וטלפון בצ'אט.` יבא את WF5-core: `n8n/scripts/import-workflow.sh n8n/workflows/05b-support-core.json`.

- [ ] **Step 2: runbook** — בטבלת ה-workflows, שורת WF5: הוסף "תפריט קטלוג בכפתורים (/menu), 'מעוניין' יוצר ליד + משימה + הודעה לבעלים; טקסט חופשי → סוכן". שורת WF2: "כפילות לפי אימייל, ואם אין — לפי טלפון". פסקה חדשה אחרי הטבלה:

```markdown
- **תפריט טלגרם (WF5)**: `/start` או `/menu` פותח כפתורי קטגוריות → מוצרים → מפרט → "מעוניין". הלוגיקה ב-`n8n/code/classify.js` ו-`n8n/code/render-menu.js` (בדיקות: `node --test n8n/code/`), מוזרקת ל-workflow בייבוא (`__CODE_NAME__`). המצב חי ב-`callback_data`; הטלפון מתחבר לליד לפי `TelegramChatId`. ליד מטלגרם: `Source=telegram`, בלי אימייל, ולכן WF3 לא שולח לו מייל קר.
```

- [ ] **Step 3: בדיקות מלאות** — `node --test n8n/code/`; `cd app && pnpm test && pnpm typecheck && pnpm lint && pnpm build`; `bash airtable/verify-schema.sh`.

- [ ] **Step 4: ייצוא** — `n8n/scripts/export-workflows.sh`; stage את WF2, WF5, WF5-core המיוצאים.

- [ ] **Step 5: Commit** — `docs: telegram catalog menu and leads`.

---

## Self-Review

**כיסוי הספק:** ניתוב (T5 Classify+Route), מסכים בית/קטגוריה/מוצר/מעוניין (T4 render-menu + T5), stateless callback_data + חיתוך 30 תווים (T4), יצירת ליד עם dedupe לפי chat+SKU, משימה, הודעה לבעלים, בקשת טלפון, חיבור טלפון, דלג (T6), סכימת Leads (T1), WF2 email/phone (T3), WF3 ללא שינוי (מסנן Email ריק — נבדק בספק), פרומפט (T7), אפליקציה: טיפוסים, טלפון, מקור, Note (T2), שגיאות: onError בכל צומת, SKU לא קיים → בית עם הודעה (T4). בדיקות: node --test, vitest, pin-data, בדיקה אנושית מפורטת.

**סטיות מהספק:** (1) "כתבו כאן כל שאלה" ל-`ask` מחליף הודעה בלי כפתור בית — יש כפתור. (2) ההודעה לבעלים כוללת `@username` כשקיים, כפי שהספק דורש. (3) ההצמדה של הטלפון מעדכנת רק `Phone`; שם מאיש הקשר לא מחליף שם קיים (הספק: "אם Name ריק" — Name לעולם לא ריק כי Classify נותן fallback). מתועד.

**סיכון פתוח:** ביטוי על `inlineKeyboard` (fixedCollection). T5 מגדיר תוכנית חלופית מפורשת ומחייב דיווח.

**עקביות שמות:** `Classify`/`Render Menu` נצרכים ב-T5/T6 בשמות זהים; `product.name/sku`, `from.name/username`, `chatId`, `messageId`, `contact.phone_number` זהים בין הקוד לביטויים.
