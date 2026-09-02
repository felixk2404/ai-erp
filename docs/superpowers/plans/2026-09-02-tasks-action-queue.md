# משימות כתור פעולות אנושיות — תוכנית ביצוע

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** טבלת `Tasks` הופכת לתור פעולות שהאוטומציה יוצרת (משלוח, מלאי, שיחה לליד, תיקון חשבונית) ובעל העסק סוגר באפליקציה.

**Architecture:** שלושה שדות חדשים ב-Airtable (`Source`, `RefId`, `Created`). ארבעה workflows ב-n8n יוצרים משימות בנקודות שדורשות בן אדם, תמיד אחרי הפעולה העסקית ותמיד עם `continueRegularOutput` כדי שכשל ביצירת משימה לא יפיל את התהליך. האפליקציה מציגה תג מקור וקישור ליעד; סוכן המנהל מקבל את המשימות הפתוחות ב-JSON.

**Tech Stack:** Airtable Metadata API (bash + jq), n8n workflows כ-JSON עם placeholders (`n8n/scripts/import-workflow.sh`), Next.js 15 App Router + Vitest באפליקציה (`app/`), n8n MCP ל-`validate_workflow` ו-`get_workflow_details`.

**Spec:** `docs/superpowers/specs/2026-09-02-tasks-action-queue-design.md`

## Global Constraints

- ערכי `Source`: `order` / `stock` / `lead` / `invoice` / `manual`. בדיוק כך, באותיות קטנות.
- סף מלאי נמוך: קבוע `3` בקוד של WF10 (`LOW_STOCK = 3`). לא קונפיגורציה.
- כל צומת שיוצר משימה ב-n8n מסומן `"onError": "continueRegularOutput"`.
- קבצי ה-workflow ב-`n8n/workflows/*.json` הם המקור. אין לערוך workflow ישירות ב-UI של n8n. אחרי כל שינוי: `n8n/scripts/import-workflow.sh n8n/workflows/<file>.json` ואז `validate_workflow` + `get_workflow_details` דרך n8n MCP.
- placeholders: `__AIRTABLE_BASE_ID__`, `__TBL_TASKS__`, `__CRED_AIRTABLE__`. הסקריפט ממלא אותם מ-`n8n/config.json`.
- קבצי `.env` אסורים לקריאה לתוך השיחה (הוק `secret-guard`). כל גישה ל-Airtable מהטרמינל עוברת דרך `airtable/*.sh` שטוענים env בעצמם.
- הודעות commit בסגנון הריפו: `feat(app): …`, `feat(n8n): …`, `chore(airtable): …`. סיום: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- טקסט למשתמש בעברית. שמות שדות באנגלית בדיוק כמו בטבלה.

---

## מבנה קבצים

| קובץ | אחריות |
|---|---|
| `airtable/add-fields.sh` (שינוי) | מוסיף `Tasks.Source`, `Tasks.RefId` |
| `airtable/verify-schema.sh` (שינוי) | הרשימה הצפויה כוללת את 3 השדות החדשים |
| `airtable/schema.md` (שינוי) | תיעוד השדות |
| `app/src/lib/types.ts` (שינוי) | `TASK_SOURCES`, `TaskSource`, `TaskFields` |
| `app/src/lib/task-source.ts` (חדש) | `taskSourceMeta(source)` → תווית עברית + href |
| `app/src/lib/task-source.test.ts` (חדש) | בדיקות ל-`taskSourceMeta` |
| `app/src/app/(app)/tasks/task-list.tsx` (שינוי) | תג מקור + קישור ליעד בכל שורה |
| `app/src/app/(app)/tasks/actions.ts` (שינוי) | `addTask` שולח `Source: 'manual'` |
| `n8n/workflows/10-order.json` (שינוי) | משימות משלוח ומלאי |
| `n8n/workflows/04-sales-replies.json` (שינוי) | משימת שיחה לליד |
| `n8n/workflows/01-invoices-validate.json` (שינוי) | משימת תיקון חשבונית |
| `n8n/workflows/09b-manager-core.json` (שינוי) | `open_tasks` ב-Build Context |
| `n8n/prompts/manager.md` (שינוי) | שורה על משימות |

---

### Task 1: סכימת Airtable

**Files:**
- Modify: `airtable/add-fields.sh`
- Modify: `airtable/verify-schema.sh:35-36` (השורות של `Tasks.Title` ו-`Tasks.Status`)
- Modify: `airtable/schema.md`

**Interfaces:**
- Produces: שדות `Tasks.Source` (singleLineText), `Tasks.RefId` (singleLineText), `Tasks.Created` (createdTime). כל המשימות הבאות מניחות שהם קיימים.

- [ ] **Step 1: הוסף את שני השדות ל-add-fields.sh**

בסוף `airtable/add-fields.sh`, אחרי השורה של `Products Highlights`:

```bash
add Tasks Source '{"name":"Source","type":"singleLineText","description":"order / stock / lead / invoice / manual"}'
add Tasks RefId '{"name":"RefId","type":"singleLineText","description":"ORD-0003 / מק\"ט / INV-0007 / record id של ליד"}'
```

- [ ] **Step 2: הרץ את הסקריפט**

Run: `bash airtable/add-fields.sh`
Expected: שתי שורות חדשות עם id של שדה (`fld...`), או `Tasks.Source exists` בהרצה חוזרת. שאר השורות `exists`.

- [ ] **Step 3: הוסף Created ידנית ב-UI של Airtable**

ה-Metadata API לא יוצר שדות `createdTime`. פתח את הבסיס ב-Airtable → טבלת Tasks → `+` → שם `Created`, סוג "Created time". זה אותו נוהל כמו ב-Invoices, Leads ו-Orders (ראה `airtable/schema.md`).

- [ ] **Step 4: עדכן את verify-schema.sh**

ב-`airtable/verify-schema.sh`, החלף את שתי השורות:

```
Tasks.Title:singleLineText
Tasks.Status:singleLineText
```

ב:

```
Tasks.Title:singleLineText
Tasks.Status:singleLineText
Tasks.Source:singleLineText
Tasks.RefId:singleLineText
Tasks.Created:createdTime
```

- [ ] **Step 5: הרץ אימות**

Run: `bash airtable/verify-schema.sh`
Expected: `schema OK`. אם `schema MISMATCH` ומופיע `> Tasks.Created:createdTime` בלבד, שלב 3 לא הושלם.

- [ ] **Step 6: עדכן schema.md**

ב-`airtable/schema.md`, החלף את שתי שורות ה-Tasks בטבלה הראשית ב:

```markdown
| Tasks | Title | Single line text | ראשי |
| Tasks | Status | Single line text | open / done |
| Tasks | Source | Single line text | order / stock / lead / invoice / manual. מי יצר את המשימה |
| Tasks | RefId | Single line text | היעד: `ORD-0003` / מק"ט / `INV-0007` / record id של ליד |
| Tasks | Created | Created time | ידני ב-UI |
```

ובפסקה האחרונה של הקובץ, החלף "מתווספים ידנית ב-UI ב-Invoices, ב-Leads וב-Orders" ב-"מתווספים ידנית ב-UI ב-Invoices, ב-Leads, ב-Orders וב-Tasks".

- [ ] **Step 7: Commit**

```bash
git add airtable/add-fields.sh airtable/verify-schema.sh airtable/schema.md
git commit -m "chore(airtable): Tasks.Source, Tasks.RefId, Tasks.Created

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: טיפוסים ו-taskSourceMeta באפליקציה

**Files:**
- Modify: `app/src/lib/types.ts:5-9,33`
- Create: `app/src/lib/task-source.ts`
- Create: `app/src/lib/task-source.test.ts`

**Interfaces:**
- Produces:
  - `TASK_SOURCES = ['order','stock','lead','invoice','manual'] as const`, `type TaskSource`.
  - `TaskFields = { Title: string; Status?: TaskStatus; Source?: TaskSource; RefId?: string; Created?: string }`.
  - `taskSourceMeta(source?: string): { label: string; href: string | null }`.

- [ ] **Step 1: כתוב את הבדיקה הנכשלת**

`app/src/lib/task-source.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { taskSourceMeta } from './task-source';

describe('taskSourceMeta', () => {
  it('maps every automated source to a hebrew label and a target page', () => {
    expect(taskSourceMeta('order')).toEqual({ label: 'משלוח', href: '/customers' });
    expect(taskSourceMeta('stock')).toEqual({ label: 'מלאי', href: '/products' });
    expect(taskSourceMeta('lead')).toEqual({ label: 'ליד', href: '/leads' });
    expect(taskSourceMeta('invoice')).toEqual({ label: 'חשבונית', href: '/invoices' });
  });

  it('manual and missing sources have no link', () => {
    expect(taskSourceMeta('manual')).toEqual({ label: 'ידני', href: null });
    expect(taskSourceMeta(undefined)).toEqual({ label: 'ידני', href: null });
  });

  it('falls back to the raw value for unknown sources', () => {
    expect(taskSourceMeta('weird')).toEqual({ label: 'weird', href: null });
  });
});
```

- [ ] **Step 2: הרץ ווודא כישלון**

Run: `cd app && pnpm vitest run src/lib/task-source.test.ts`
Expected: FAIL — `Cannot find module './task-source'`.

- [ ] **Step 3: הוסף טיפוסים**

ב-`app/src/lib/types.ts`, אחרי `export const TASK_STATUSES = ['open', 'done'] as const;` הוסף:

```ts
export const TASK_SOURCES = ['order', 'stock', 'lead', 'invoice', 'manual'] as const;
```

אחרי `export type TaskStatus = ...` הוסף:

```ts
export type TaskSource = (typeof TASK_SOURCES)[number];
```

והחלף את השורה `export type TaskFields = { Title: string; Status?: TaskStatus };` ב:

```ts
export type TaskFields = { Title: string; Status?: TaskStatus; Source?: TaskSource; RefId?: string; Created?: string };
```

- [ ] **Step 4: כתוב את task-source.ts**

`app/src/lib/task-source.ts`:

```ts
import type { TaskSource } from './types';

export type TaskSourceMeta = { label: string; href: string | null };

/** מי יצר את המשימה ולאן ללכת כדי לטפל בה. `manual` וחסר = ידני, בלי קישור. */
const MAP: Record<TaskSource, TaskSourceMeta> = {
  order: { label: 'משלוח', href: '/customers' },
  stock: { label: 'מלאי', href: '/products' },
  lead: { label: 'ליד', href: '/leads' },
  invoice: { label: 'חשבונית', href: '/invoices' },
  manual: { label: 'ידני', href: null },
};

export function taskSourceMeta(source?: string): TaskSourceMeta {
  if (!source) return MAP.manual;
  return (MAP as Record<string, TaskSourceMeta>)[source] ?? { label: source, href: null };
}
```

- [ ] **Step 5: הרץ ווודא הצלחה**

Run: `cd app && pnpm vitest run src/lib/task-source.test.ts && pnpm typecheck`
Expected: 3 passed; typecheck בלי שגיאות.

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/types.ts app/src/lib/task-source.ts app/src/lib/task-source.test.ts
git commit -m "feat(app): task source type and meta

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: מסך המשימות — תג מקור, קישור, Source=manual

**Files:**
- Modify: `app/src/app/(app)/tasks/task-list.tsx:10-35` (הרכיב `TaskRow`)
- Modify: `app/src/app/(app)/tasks/actions.ts:16`

**Interfaces:**
- Consumes: `taskSourceMeta` מ-Task 2; `Task` (`Rec<TaskFields>`).

- [ ] **Step 1: עדכן addTask לשלוח Source=manual**

ב-`app/src/app/(app)/tasks/actions.ts`, החלף:

```ts
    await erpCreate<TaskFields>('Tasks', { Title, Status: 'open' });
```

ב:

```ts
    await erpCreate<TaskFields>('Tasks', { Title, Status: 'open', Source: 'manual' });
```

- [ ] **Step 2: עדכן TaskRow**

ב-`app/src/app/(app)/tasks/task-list.tsx`, הוסף imports בראש הקובץ:

```ts
import Link from 'next/link';
import { taskSourceMeta } from '@/lib/task-source';
```

והחלף את ה-`<label>` בתוך `TaskRow` ב:

```tsx
      <label htmlFor={id} className={`flex-1 py-3 text-sm cursor-pointer ${done ? 'text-ink-3 line-through' : 'text-ink'}`}>
        {task.fields.Title}
      </label>
      <TaskSourceTag source={task.fields.Source} refId={task.fields.RefId} />
```

ומעל `function TaskRow` הוסף:

```tsx
/** תג מקור: לאוטומציה יש קישור למסך היעד, למשימה ידנית רק תווית. */
function TaskSourceTag({ source, refId }: { source?: string; refId?: string }) {
  const m = taskSourceMeta(source);
  const text = refId ? `${m.label} · ${refId}` : m.label;
  const cls = 'shrink-0 text-[12px] text-ink-3 whitespace-nowrap';
  if (!m.href) return <span className={cls}>{text}</span>;
  return (
    <Link href={m.href} className={`${cls} underline-offset-4 hover:underline hover:text-ink`} aria-label={`${m.label} ${refId ?? ''} — פתח`}>
      <span dir="ltr">{text}</span>
    </Link>
  );
}
```

הערה: `RefId` הוא מזהה לטיני (`ORD-0003`, מק"ט) ולכן `dir="ltr"` בתוך הקישור. התווית העברית לפניו מוצגת נכון כי הטקסט המשולב קצר; אם המספר נשבר בצד הלא נכון, עטוף רק את `refId` ב-`<span dir="ltr">` והשאר את התווית בחוץ.

- [ ] **Step 3: בדיקות, typecheck, lint**

Run: `cd app && pnpm test && pnpm typecheck && pnpm lint`
Expected: כל הבדיקות עוברות (כולל הקיימות), בלי שגיאות טיפוס או lint.

- [ ] **Step 4: בדיקה ויזואלית**

Run: `cd app && pnpm dev` ואז פתח `http://localhost:3100/tasks` (סיסמה מ-`APP_PASSWORD`). הוסף משימה. צפוי: המשימה מופיעה עם התג "ידני" בלי קישור. ב-Airtable הרשומה קיבלה `Source=manual`.

- [ ] **Step 5: Commit**

```bash
git add "app/src/app/(app)/tasks/task-list.tsx" "app/src/app/(app)/tasks/actions.ts"
git commit -m "feat(app): task source tag and manual source on create

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: WF10 — משימות משלוח ומלאי

**Files:**
- Modify: `n8n/workflows/10-order.json` (צומת `Compute`, צמתים חדשים, `connections`)

**Interfaces:**
- Consumes: `Compute` מחזיר פריט אחד עם `orderNumber`, `customer.city`, `lines[] = {sku,name,qty,price,service,stock,recId}`, `result`.
- Produces: `Compute.json.shipTask` (אובייקט או `null`), `Compute.json.lowStock[] = {sku,name,left}`. צמתים חדשים: `Open Stock Tasks` → `Build Tasks` → `Has Tasks?` → `Create Tasks` → `Result`.

הרעיון: אחרי `Confirm Order` שולפים משימות מלאי פתוחות, בונים ב-Code **פריט אחד** עם `records[]` (אפס או יותר), ואם יש מה ליצור שולחים POST אחד ל-Airtable. שני הענפים של ה-IF מגיעים ל-`Result`, כך שהתשובה לחנות תמיד נשלחת.

- [ ] **Step 1: הוסף shipTask ו-lowStock ל-Compute**

ב-`n8n/workflows/10-order.json`, בתוך `jsCode` של הצומת `Compute`, מיד לפני השורה שמתחילה ב-`const telegramText =`, הוסף (זכור: זה מחרוזת JSON, גרשיים כפולים ושורות חדשות חייבים escape כמו בשאר הקוד):

```js
const LOW_STOCK = 3;
const shipTask = hasPhysical ? { Title: `לשלוח ${orderNumber} ל${v.customer.city}`, Status: 'open', Source: 'order', RefId: orderNumber } : null;
const lowStock = lines.filter((l) => !l.service && (Number(l.stock) || 0) - l.qty < LOW_STOCK).map((l) => ({ sku: l.sku, name: l.name, left: Math.max(0, (Number(l.stock) || 0) - l.qty) }));
```

ובאובייקט ההחזרה (`return [{ json: { ... } }]`), אחרי `emailHtml, telegramText,` הוסף:

```js
  shipTask, lowStock,
```

- [ ] **Step 2: הוסף ארבעה צמתים**

למערך `nodes` הוסף (מיקומים אחרי `Confirm Order` שנמצא ב-`[4940, 0]`; הזז את `Result` ל-`[6240, 0]`):

```json
{ "name": "Open Stock Tasks", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [5200, 0],
  "parameters": { "method": "GET", "url": "https://api.airtable.com/v0/__AIRTABLE_BASE_ID__/__TBL_TASKS__",
    "authentication": "predefinedCredentialType", "nodeCredentialType": "airtableTokenApi",
    "sendQuery": true, "queryParameters": { "parameters": [
      { "name": "filterByFormula", "value": "AND({Source}='stock', {Status}='open')" },
      { "name": "fields[]", "value": "RefId" } ] },
    "options": { "timeout": 20000 } },
  "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
  "onError": "continueRegularOutput" },
{ "name": "Build Tasks", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [5460, 0],
  "parameters": { "mode": "runOnceForAllItems", "jsCode": "// Build Tasks — פריט אחד תמיד. records ריק = אין מה ליצור.\nconst c = $('Compute').first().json;\nconst existing = new Set((($input.first().json || {}).records || []).map((r) => r.fields && r.fields.RefId));\nconst records = [];\nif (c.shipTask) records.push({ fields: c.shipTask });\nfor (const p of c.lowStock || []) {\n  if (existing.has(p.sku)) continue;\n  records.push({ fields: { Title: `להזמין מלאי: ${p.name}, נשארו ${p.left}`, Status: 'open', Source: 'stock', RefId: p.sku } });\n}\nreturn [{ json: { records } }];" } },
{ "name": "Has Tasks?", "type": "n8n-nodes-base.if", "typeVersion": 2.3, "position": [5720, 0],
  "parameters": { "conditions": { "options": { "caseSensitive": true, "leftValue": "", "typeValidation": "loose", "version": 2 },
    "conditions": [ { "id": "t1", "leftValue": "={{ ($json.records || []).length }}", "rightValue": 0, "operator": { "type": "number", "operation": "gt" } } ],
    "combinator": "and" }, "looseTypeValidation": true, "options": {} } },
{ "name": "Create Tasks", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [5980, 0],
  "parameters": { "method": "POST", "url": "https://api.airtable.com/v0/__AIRTABLE_BASE_ID__/__TBL_TASKS__",
    "authentication": "predefinedCredentialType", "nodeCredentialType": "airtableTokenApi",
    "sendBody": true, "contentType": "json", "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({ records: $json.records.slice(0, 10), typecast: true }) }}",
    "options": { "timeout": 20000 } },
  "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
  "onError": "continueRegularOutput" }
```

`slice(0, 10)`: Airtable מקבל עד 10 רשומות ב-POST אחד; הזמנה מוגבלת ל-10 שורות ועוד משלוח, אז בפועל לא נחתך.

- [ ] **Step 3: עדכן connections**

ב-`connections`, החלף:

```json
"Confirm Order": { "main": [[ { "node": "Result", "type": "main", "index": 0 } ]] }
```

ב:

```json
"Confirm Order": { "main": [[ { "node": "Open Stock Tasks", "type": "main", "index": 0 } ]] },
"Open Stock Tasks": { "main": [[ { "node": "Build Tasks", "type": "main", "index": 0 } ]] },
"Build Tasks": { "main": [[ { "node": "Has Tasks?", "type": "main", "index": 0 } ]] },
"Has Tasks?": { "main": [
  [ { "node": "Create Tasks", "type": "main", "index": 0 } ],
  [ { "node": "Result", "type": "main", "index": 0 } ] ] },
"Create Tasks": { "main": [[ { "node": "Result", "type": "main", "index": 0 } ]] }
```

- [ ] **Step 4: ודא JSON תקין ויבא**

Run: `jq -e '.nodes | length' n8n/workflows/10-order.json && n8n/scripts/import-workflow.sh n8n/workflows/10-order.json`
Expected: מספר צמתים (26), ואז `WF10 — הזמנה מהחנות  id=9l2sTtJMunb5UTFE  active=false`. WF10 הוא sub-workflow, לא צריך `--activate`.

- [ ] **Step 5: אמת עם n8n MCP**

קרא `validate_workflow` עם `workflowId: "9l2sTtJMunb5UTFE"`, ואז `get_workflow_details` ובדוק ש-`connections["Has Tasks?"].main` מכיל שני ענפים ששניהם מגיעים ל-`Result` (ישירות או דרך `Create Tasks`).
Expected: אין שגיאות ולידציה.

- [ ] **Step 6: בדיקת קצה לקצה**

הכן מלאי נמוך: ב-Airtable, קבע `Products.Stock` של `TY-CB-UC100` ל-`4` (ההזמנה happy קונה 2 → נשארו 2, מתחת ל-3).

Run: `n8n/scripts/order-test.sh happy`
Expected: `{"ok":true,"orderNumber":"ORD-000N",...}`.

בדוק ב-Airtable, טבלת Tasks: שתי רשומות חדשות —
- `לשלוח ORD-000N לתל אביב` / Source `order` / RefId `ORD-000N`
- `להזמין מלאי: <שם הכבל>, נשארו 2` / Source `stock` / RefId `TY-CB-UC100`

Run שוב: `n8n/scripts/order-test.sh happy`
Expected: משימת משלוח חדשה ל-ORD-000(N+1); **לא** נוצרה משימת מלאי נוספת ל-`TY-CB-UC100`.

Run: `n8n/scripts/order-test.sh service`
Expected: `ok:true`, ואין משימות חדשות (שירות בלבד: אין משלוח, אין מלאי).

אחרי הבדיקה החזר את `Stock` לערך המקורי או הרץ `bash airtable/seed-stock.sh` (מדלג על מוצרים עם Stock, אז לעדכן ידנית).

- [ ] **Step 7: Commit**

```bash
git add n8n/workflows/10-order.json n8n/config.json
git commit -m "feat(n8n): WF10 creates ship and low-stock tasks

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: WF4 — משימת שיחה לליד שענה

**Files:**
- Modify: `n8n/workflows/04-sales-replies.json`

**Interfaces:**
- Consumes: `Contacted Lead` מחזיר `records[0] = {id, fields: {Name, Company, Email}}`; `Mark Qualified` מחזיר את הרשומה המעודכנת.
- Produces: צומת `Create Call Task` אחרי `Mark Qualified`.

- [ ] **Step 1: הוסף את הצומת**

למערך `nodes` הוסף (מיקום: 260 ימינה מ-`Mark Qualified`):

```json
{ "name": "Create Call Task", "type": "n8n-nodes-base.airtable", "typeVersion": 2.2, "position": [1300, 0],
  "parameters": { "authentication": "airtableTokenApi", "operation": "create",
    "base": { "__rl": true, "mode": "id", "value": "__AIRTABLE_BASE_ID__" },
    "table": { "__rl": true, "mode": "id", "value": "__TBL_TASKS__" },
    "columns": { "mappingMode": "defineBelow", "value": {
        "Title": "=להתקשר ל{{ $('Contacted Lead').first().json.records[0].fields.Name }} ({{ $('Contacted Lead').first().json.records[0].fields.Company || 'ללא חברה' }})",
        "Status": "open",
        "Source": "lead",
        "RefId": "={{ $('Contacted Lead').first().json.records[0].id }}" },
      "matchingColumns": [], "schema": [
        { "id": "Title", "displayName": "Title", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
        { "id": "Status", "displayName": "Status", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
        { "id": "Source", "displayName": "Source", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
        { "id": "RefId", "displayName": "RefId", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false } ] },
    "options": { "typecast": true } },
  "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
  "onError": "continueRegularOutput" }
```

התאם את `position` לפי ה-position של `Mark Qualified` בקובץ (x + 260).

- [ ] **Step 2: חבר**

ב-`connections` הוסף:

```json
"Mark Qualified": { "main": [[ { "node": "Create Call Task", "type": "main", "index": 0 } ]] }
```

- [ ] **Step 3: יבא והפעל**

Run: `n8n/scripts/import-workflow.sh n8n/workflows/04-sales-replies.json --activate`
Expected: `WF4 — סוכן מכירות (תשובות)  id=5cQhVanCfhxM16ru  active=true`.

- [ ] **Step 4: אמת**

`validate_workflow` עם `workflowId: "5cQhVanCfhxM16ru"`; `get_workflow_details` ובדוק `connections["Mark Qualified"]` → `Create Call Task`.

- [ ] **Step 5: בדיקת קצה לקצה**

באפליקציה, מסך לידים: צור ליד עם האימייל שלך, לחץ "שלח מייל לליד הבא". ענה למייל מהתיבה שלך. תוך 30 דקות (Gmail Trigger) הליד עובר ל-`Qualified` ובטבלת Tasks מופיעה `להתקשר ל<שם> (<חברה>)` עם Source `lead` ו-RefId `rec...`. לבדיקה מהירה יותר: ב-n8n UI פתח את WF4 ולחץ "Execute workflow" עם pin data של הודעה מהאימייל הזה.

- [ ] **Step 6: Commit**

```bash
git add n8n/workflows/04-sales-replies.json n8n/config.json
git commit -m "feat(n8n): WF4 creates call task for qualified lead

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: WF1 — משימת תיקון לחשבונית שגויה

**Files:**
- Modify: `n8n/workflows/01-invoices-validate.json`

**Interfaces:**
- Consumes: `Loop Over Items` (הפריט הנוכחי: `{id, fields: {InvoiceNumber?, Amount?, CustomerId?}}`), `Find Customer` (`records[]`), `Is Valid` (Amount > 0 וגם נמצא לקוח).
- Produces: צומת `Create Fix Task` בין `Mark Error` ל-`Loop Over Items`.

- [ ] **Step 1: הוסף את הצומת**

```json
{ "name": "Create Fix Task", "type": "n8n-nodes-base.airtable", "typeVersion": 2.2, "position": [2100, 320],
  "parameters": { "authentication": "airtableTokenApi", "operation": "create",
    "base": { "__rl": true, "mode": "id", "value": "__AIRTABLE_BASE_ID__" },
    "table": { "__rl": true, "mode": "id", "value": "__TBL_TASKS__" },
    "columns": { "mappingMode": "defineBelow", "value": {
        "Title": "=לתקן {{ $('Loop Over Items').first().json.fields.InvoiceNumber || 'חשבונית ללא מספר' }}: {{ (($('Loop Over Items').first().json.fields.Amount || 0) > 0) ? 'לקוח ' + ($('Loop Over Items').first().json.fields.CustomerId || '?') + ' לא נמצא' : 'סכום חסר' }}",
        "Status": "open",
        "Source": "invoice",
        "RefId": "={{ $('Loop Over Items').first().json.fields.InvoiceNumber || $('Loop Over Items').first().json.id }}" },
      "matchingColumns": [], "schema": [
        { "id": "Title", "displayName": "Title", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
        { "id": "Status", "displayName": "Status", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
        { "id": "Source", "displayName": "Source", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false },
        { "id": "RefId", "displayName": "RefId", "required": false, "defaultMatch": false, "display": true, "type": "string", "readOnly": false, "removed": false } ] },
    "options": { "typecast": true } },
  "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } },
  "onError": "continueRegularOutput" }
```

התאם `position` ל-`Mark Error` בקובץ (x + 260, אותו y).

- [ ] **Step 2: חבר**

ב-`connections`, החלף:

```json
"Mark Error": { "main": [[ { "node": "Loop Over Items", "type": "main", "index": 0 } ]] }
```

ב:

```json
"Mark Error": { "main": [[ { "node": "Create Fix Task", "type": "main", "index": 0 } ]] },
"Create Fix Task": { "main": [[ { "node": "Loop Over Items", "type": "main", "index": 0 } ]] }
```

חשוב: `onError: continueRegularOutput` הוא מה שמבטיח שהלולאה ממשיכה גם אם יצירת המשימה נכשלה.

- [ ] **Step 3: יבא והפעל**

Run: `n8n/scripts/import-workflow.sh n8n/workflows/01-invoices-validate.json --activate`
Expected: `WF1 — אימות חשבוניות  id=ZT0p1wXRsraCrUqA  active=true`.

- [ ] **Step 4: אמת**

`validate_workflow` עם `workflowId: "ZT0p1wXRsraCrUqA"`; `get_workflow_details`: `Mark Error → Create Fix Task → Loop Over Items`.

- [ ] **Step 5: בדיקת קצה לקצה**

באפליקציה, מסך חשבוניות: צור חשבונית עם `CustomerId` שלא קיים (למשל `CUST-9999`) וסכום חיובי. תוך דקה (Airtable Trigger) הסטטוס `error` ובטבלת Tasks: `לתקן INV-000N: לקוח CUST-9999 לא נמצא` / Source `invoice` / RefId `INV-000N`. (אם המספור ניתן רק בשלב validated, ה-Title יהיה `לתקן חשבונית ללא מספר: …` וה-RefId יהיה `rec...`; שני המקרים תקינים.)

- [ ] **Step 6: Commit**

```bash
git add n8n/workflows/01-invoices-validate.json n8n/config.json
git commit -m "feat(n8n): WF1 creates fix task for invoice errors

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: WF9 — סוכן המנהל מכיר את המשימות

**Files:**
- Modify: `n8n/workflows/09b-manager-core.json` (צומת `Build Context`)
- Modify: `n8n/prompts/manager.md`

**Interfaces:**
- Consumes: `Search Tasks` (כל רשומות Tasks, `fields: {Title, Status, Source, RefId, Created}`).
- Produces: `data.open_tasks[] = {title, source, ref}` (עד 8, החדשות קודם).

- [ ] **Step 1: הוסף open_tasks ל-Build Context**

ב-`09b-manager-core.json`, בביטוי של השדה `data` ב-`Build Context`, מיד לפני `generated_at: $now.toISO()`, הוסף:

```js
open_tasks: [...$('Search Tasks').all()].filter(i => i.json.fields?.Status !== 'done').sort((a, b) => String(b.json.fields?.Created || '').localeCompare(String(a.json.fields?.Created || ''))).slice(0, 8).map(i => ({ title: i.json.fields?.Title, source: i.json.fields?.Source || 'manual', ref: i.json.fields?.RefId || null })),
```

(הביטוי כולו הוא מחרוזת JSON אחת; שמור על escaping של גרשיים כמו בשאר הביטוי.)

- [ ] **Step 2: עדכן את הפרומפט**

ב-`n8n/prompts/manager.md`, הוסף בסוף הקובץ שורה:

```
משימות (open_tasks) הן פעולות שהאוטומציה לא יכולה לבצע בעצמה: משלוחים (source=order), הזמנת מלאי (stock), שיחות ללידים (lead), תיקון חשבוניות (invoice), ומשימות ידניות (manual). כששואלים מה לעשות היום או מה דחוף, ענה מתוך open_tasks לפי הסדר, עם ה-ref כשקיים. תרגם: order=משלוח, stock=מלאי, lead=ליד, invoice=חשבונית, manual=ידני.
```

- [ ] **Step 3: יבא**

Run: `n8n/scripts/import-workflow.sh n8n/workflows/09b-manager-core.json`
Expected: `WF9-core — סוכן המנהל  id=zFz32ARQ3kedlK1f  active=…`.

- [ ] **Step 4: אמת**

`validate_workflow` עם `workflowId: "zFz32ARQ3kedlK1f"`. אחר כך `get_workflow_details` ובדוק שה-`systemMessage` של `Manager Agent` מכיל "open_tasks" (הפרומפט הוזרק).

- [ ] **Step 5: בדיקת קצה לקצה**

בטלגרם, לבוט המנהל: "מה יש לעשות היום?"
Expected: תשובה שמונה את המשימות הפתוחות מ-Task 4–6 עם המקור בעברית ("משלוח ORD-000N", "מלאי TY-CB-UC100"), בלי המילים באנגלית.

אימות דרך MCP: `search_workflow_executions` ל-`zFz32ARQ3kedlK1f`, `get_workflow_execution` על האחרונה עם `nodeNames: ["Build Context"]` — ה-`data` מכיל `open_tasks` עם הרשומות.

- [ ] **Step 6: Commit**

```bash
git add n8n/workflows/09b-manager-core.json n8n/prompts/manager.md n8n/config.json
git commit -m "feat(n8n): manager agent sees open tasks

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: תיעוד ואימות סופי

**Files:**
- Modify: `docs/runbook.md` (טבלת ה-workflows, סביב שורה 48)

- [ ] **Step 1: עדכן את ה-runbook**

בטבלת ה-workflows ב-`docs/runbook.md`, הוסף לתיאור של WF1, WF4 ו-WF10 את יצירת המשימה, ואחרי הטבלה פסקה:

```markdown
- **משימות (Tasks)**: תור פעולות אנושיות. WF10 יוצר "לשלוח ORD-…" לכל הזמנה פיזית ו"להזמין מלאי" כשמלאי יורד מתחת ל-3 (בלי כפילות לאותו מק"ט). WF4 יוצר "להתקשר ל…" לליד שענה. WF1 יוצר "לתקן INV-…" לחשבונית שגויה. `Source` + `RefId` מקשרים למסך היעד באפליקציה. סוכן המנהל מקבל `open_tasks`.
```

- [ ] **Step 2: הרץ את כל הבדיקות**

Run: `cd app && pnpm test && pnpm typecheck && pnpm lint && pnpm build`
Expected: הכל ירוק.

Run: `bash airtable/verify-schema.sh`
Expected: `schema OK`.

- [ ] **Step 3: ייצא את ה-workflows המעודכנים**

Run: `n8n/scripts/export-workflows.sh`
Expected: הקבצים ב-`n8n/workflows/exported/` מתעדכנים ל-WF1, WF4, WF9-core, WF10.

- [ ] **Step 4: Commit**

```bash
git add docs/runbook.md n8n/workflows/exported
git commit -m "docs: tasks as human action queue

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-Review

**כיסוי הספק:** סכימה (Task 1), WF10 משלוח + מלאי + מניעת כפילות + סף 3 (Task 4), WF4 (Task 5), WF1 (Task 6), WF9 open_tasks + פרומפט (Task 7), אפליקציה: טיפוסים, תג, קישור, manual (Tasks 2–3), continueRegularOutput בכל יוצר (Global). "משימה מטלגרם" שייכת לספק הטלגרם ולא כאן.

**סטייה מכוונת מהספק:** הקישור מהתג הוא לדף היעד בלי `?q=` — המסכים לא תומכים בפרמטר חיפוש כזה היום, והספק התיר "אחרת קישור פשוט".

**עקביות שמות:** `Source`/`RefId` זהים ב-Airtable, ב-n8n ובאפליקציה. `taskSourceMeta` מוגדר ב-Task 2 ונצרך ב-Task 3. `shipTask`/`lowStock` מוגדרים ב-Compute (Task 4 שלב 1) ונצרכים ב-`Build Tasks` (שלב 2).
