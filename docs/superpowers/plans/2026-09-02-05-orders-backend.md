# Plan 5 — Orders backend (Airtable + n8n) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ERP able to accept a storefront order end to end: stock per product, an `Orders` table, WF10 that validates stock, creates order + customer + invoice, decrements stock, emails the customer and notifies the manager; WF13 `order` / `order_status` actions; a live stock tool for the support agent; orders in the manager agent's context.

**Architecture:** Every write goes through the existing WF13 webhook. WF10 is a sub-workflow (Execute Workflow Trigger) that carries **one item** through HTTP Request nodes to Airtable and two Code nodes (validate, compute). Prices always come from the catalog, never from the client. The invoice is created with `Items` + `Amount` + a precomputed `InvoiceNumber`; WF1 and WF8 (unchanged) add VAT and the PDF.

**Tech Stack:** n8n 2.36 (Docker, ngrok), Airtable REST + Metadata API, Gmail OAuth (credential "Gmail ERP"), Telegram (credential "Telegram Manager"), bash + python3 scripts under `airtable/` and `n8n/scripts/`.

**Spec:** `docs/superpowers/specs/2026-09-02-storefront-design.md` (sections 4, 5, 11).

## Global Constraints

- Never read or write `n8n/.env`; scripts `cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh`. Never print secret values.
- Workflow JSON templates live in `n8n/workflows/*.json` with placeholders `__AIRTABLE_BASE_ID__`, `__TBL_*__`, `__CRED_*__`, `__WF_<KEY>_ID__`, `__PROMPT_<NAME>__`, `__MODEL__`, `__OWNER_CHAT_ID__`, `__NGROK_DOMAIN__`. Import with `n8n/scripts/import-workflow.sh <file> --activate`. The config key for a file `10-order.json` is `ORDER` → `__WF_ORDER_ID__`. A sub-workflow must be imported and active **before** the workflow that calls it.
- Airtable node output is `{id, createdTime, fields}`; HTTP Request to Airtable returns `{records:[...]}`. Keep one item per execution in WF10.
- Money: catalog prices include 18% VAT. `Total = Subtotal + Shipping`. `Vat = round2(Total − Total/1.18)`. Invoice `Amount = round2(Total/1.18)`. Shipping = 29; 0 when Subtotal ≥ 300 or when all lines are services. Category `שירותים` = service (no stock, never out of stock). Max 20 lines, qty 1–99.
- Status values: Orders `new → confirmed → shipped → delivered | cancelled`. Invoices unchanged.
- Hebrew, plain text, no emoji in customer email; HTML must escape user input.
- After every workflow change: `n8n/scripts/export-workflows.sh` and commit `n8n/workflows/exported/`.
- Do not touch `app/` in this plan (parallel uncommitted work there).

## File map

| File | Responsibility |
|---|---|
| `airtable/create-tables.sh` (modify) | add `Orders` table + `Created` rename loop for Orders |
| `airtable/add-fields.sh` (modify) | add `Products.Stock` (number, precision 0), `Products.Highlights` (multilineText) |
| `airtable/seed-stock.sh` (create) | deterministic stock + highlights backfill, InStock sync |
| `airtable/schema.md` (modify) | document Orders, Stock, Highlights |
| `n8n/workflows/10-order.json` (create) | WF10 sub-workflow |
| `n8n/workflows/13-api.json` (modify) | routes `order`, `order_status` |
| `n8n/workflows/05b-support-core.json` (modify) | `check_stock` HTTP tool |
| `n8n/prompts/customer-service.md` (modify) | stock/shipping rules, web + telegram |
| `n8n/workflows/09b-manager-core.json` (modify) | Orders summary in context |
| `n8n/prompts/manager.md` (modify) | knows about orders |
| `n8n/scripts/order-test.sh` (create) | happy path / out-of-stock / status checks against WF13 |
| `docs/runbook.md` (modify) | WF10 row, order-test, seed-stock |

---

### Task 1: Airtable schema — Orders table, Stock, Highlights

**Files:**
- Modify: `airtable/create-tables.sh` (after the `create Customers` line and in the `for t in Invoices Leads` loop)
- Modify: `airtable/add-fields.sh`
- Modify: `airtable/schema.md`
- Modify: `n8n/config.json` (add `TBL_ORDERS`)

**Interfaces:**
- Produces: Airtable table `Orders` with fields `OrderNumber, CustomerId, Name, Email, Phone, Address, City, Items, Subtotal, Shipping, Vat, Total, Status, InvoiceNumber, Note, Created`; `Products.Stock` (integer), `Products.Highlights` (long text); config key `TBL_ORDERS`.

- [ ] **Step 1: Add the Orders table to create-tables.sh**

Add an integer helper next to `num()` and the create line after `create Customers`:

```bash
int()      { printf '{"name":"%s","type":"number","options":{"precision":0}}' "$1"; }
create Orders    "$(text OrderNumber),$(text CustomerId),$(text Name),$(email Email),$(phone Phone),$(text Address),$(text City),$(longtext Items),$(num Subtotal),$(num Shipping),$(num Vat),$(num Total),$(text Status),$(text InvoiceNumber),$(longtext Note)"
```

Change the rename loop to `for t in Invoices Leads Orders; do`.

- [ ] **Step 2: Add Stock and Highlights to add-fields.sh**

```bash
add Products Stock '{"name":"Stock","type":"number","options":{"precision":0},"description":"כמות במלאי. ריק לשירותים."}'
add Products Highlights '{"name":"Highlights","type":"multilineText","description":"3 נקודות מפרט, שורה לכל נקודה"}'
```

- [ ] **Step 3: Run both scripts**

Run: `airtable/create-tables.sh && airtable/add-fields.sh`
Expected: `Orders <tblId>` printed (or `exists`), then `Products.Stock fld...`, `Products.Highlights fld...`, and the line `ידני: ב-Orders הוסיפו שדה 'Created'`.

- [ ] **Step 4: Ask Felix to add the Created field in Airtable UI**

Message (Hebrew): open the base → table Orders → `+` → field type "Created time" → name `created` → save. Then re-run `airtable/create-tables.sh`; expected `Orders rename createdTime field -> Created: Created`.

- [ ] **Step 5: Store the table id in config.json**

Run: `airtable/show-schema.sh | grep -i orders` (prints `Orders tbl...`), then:
```bash
jq --arg id "<tblId>" '.TBL_ORDERS = $id' n8n/config.json > n8n/config.json.tmp && mv n8n/config.json.tmp n8n/config.json
```

- [ ] **Step 6: Verify and document**

Run: `airtable/verify-schema.sh` → must list Orders with 16 fields. Add to `airtable/schema.md`:

```markdown
## Orders (חנות)
| שדה | סוג | הערות |
|---|---|---|
| OrderNumber | text | ORD-0001, מספור רץ ב-WF10 |
| CustomerId | text | מפתח זר ל-Customers |
| Name, Email, Phone, Address, City | text/email/phone | פרטי הלקוח כפי שהוקלדו בקופה |
| Items | long text | JSON [{sku,name,qty,price}] — אותו פורמט כמו Invoices.Items |
| Subtotal, Shipping, Vat, Total | number | מחושבים ב-WF10; מחירים כוללים מע"מ |
| Status | text | new → confirmed → shipped → delivered / cancelled |
| InvoiceNumber | text | INV-000N שנוצרה עבור ההזמנה |
| Note | long text | הערת לקוח |
| Created | created time | ידני |

Products.Stock (number, integer) — רק פריטים פיזיים; שירותים ריק. Products.Highlights — 3 שורות מפרט.
```

- [ ] **Step 7: Commit**

```bash
git add airtable/create-tables.sh airtable/add-fields.sh airtable/schema.md n8n/config.json
git commit -m "feat(airtable): Orders table, Products.Stock and Highlights"
```

---

### Task 2: Seed stock and highlights

**Files:**
- Create: `airtable/seed-stock.sh`

**Interfaces:**
- Consumes: `Products` records with `Sku, Category, Description, InStock`.
- Produces: every physical product has integer `Stock` (0–40, deterministic by SKU; `InStock=false` → 0; at least two zeros), `InStock = Stock > 0`; services have `Stock` empty; all products have `Highlights` (≤3 lines).

- [ ] **Step 1: Write the script**

```bash
#!/usr/bin/env bash
# מלאי התחלתי דטרמיניסטי + 3 נקודות מפרט לכל מוצר. בטוח להרצה חוזרת (מדלג על מוצרים שכבר יש להם Stock).
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
export AIRTABLE_PAT AIRTABLE_BASE_ID
python3 - <<'PY'
import json, os, re, urllib.request, urllib.parse, hashlib
pat, base = os.environ["AIRTABLE_PAT"], os.environ["AIRTABLE_BASE_ID"]
H = {"Authorization": f"Bearer {pat}", "Content-Type": "application/json"}
def get(path):
    with urllib.request.urlopen(urllib.request.Request(f"https://api.airtable.com/v0/{base}/{path}", headers=H)) as r: return json.load(r)
def patch(table, records):
    req = urllib.request.Request(f"https://api.airtable.com/v0/{base}/{table}", data=json.dumps({"records": records, "typecast": True}).encode(), headers=H, method="PATCH")
    with urllib.request.urlopen(req) as r: return len(json.load(r)["records"])
recs, offset = [], ""
while True:
    page = get("Products?pageSize=100" + (f"&offset={offset}" if offset else ""))
    recs += page["records"]; offset = page.get("offset", "")
    if not offset: break
SERVICE = "שירותים"
def highlights(desc):
    m = re.search(r"מפרט:\s*(.*)", desc or "")
    parts = [p.strip(" .") for p in re.split(r"[;؛]", m.group(1) if m else (desc or "")) if p.strip()]
    return "\n".join(parts[:3])
updates, zeros = [], 0
for r in sorted(recs, key=lambda r: r["fields"].get("Sku", "")):
    f = r["fields"]; sku = f.get("Sku", r["id"]); fields = {}
    if not f.get("Highlights"): fields["Highlights"] = highlights(f.get("Description", ""))
    if f.get("Category") != SERVICE and f.get("Stock") is None:
        stock = 0 if not f.get("InStock") else 1 + int(hashlib.md5(sku.encode()).hexdigest(), 16) % 40
        if stock == 0: zeros += 1
        fields["Stock"] = stock; fields["InStock"] = stock > 0
    if fields: updates.append({"id": r["id"], "fields": fields})
# לפחות שני מוצרים ב-0 להדגמת "נגמר במלאי"
physical = [u for u in updates if "Stock" in u["fields"]]
for u in physical:
    if zeros >= 2: break
    if u["fields"]["Stock"] > 0: u["fields"]["Stock"] = 0; u["fields"]["InStock"] = False; zeros += 1
n = sum(patch("Products", updates[i:i+10]) for i in range(0, len(updates), 10))
print(f"updated {n} products, out-of-stock: {zeros}")
PY
```

- [ ] **Step 2: Run it and check**

Run: `chmod +x airtable/seed-stock.sh && airtable/seed-stock.sh`
Expected: `updated 34 products, out-of-stock: 2` (or 3).
Run: `airtable/show-records.sh Products "{Category}='שירותים'" | head -3` → Stock column empty; `airtable/show-records.sh Products "{Stock}=0"` → ≥2 rows.

- [ ] **Step 3: Re-run to prove idempotence**

Run: `airtable/seed-stock.sh` → `updated 0 products` (Highlights already set, Stock already set).

- [ ] **Step 4: Commit**

```bash
git add airtable/seed-stock.sh
git commit -m "feat(airtable): seed deterministic stock and highlights"
```

---

### Task 3: WF10 — order sub-workflow

**Files:**
- Create: `n8n/workflows/10-order.json`

**Interfaces:**
- Consumes: workflow input `order` (json): `{customer:{name,email,phone,address?,city?}, items:[{sku,qty}], note?}`.
- Produces: last node `Result` emits one item: `{ok:true, orderNumber, invoiceNumber, total, subtotal, shipping, vat, items:[{sku,name,qty,price}]}` or `{ok:false, error:string, outOfStock?:[{sku,name,available}]}`. Config key `ORDER` (`__WF_ORDER_ID__`).

Node list (all positions left→right, 260px apart). Every HTTP node: `authentication: predefinedCredentialType`, `nodeCredentialType: airtableTokenApi`, credential `__CRED_AIRTABLE__`, `options.timeout: 20000`.

| # | Node | Type | Key parameters |
|---|---|---|---|
| 1 | When Executed by Another Workflow | executeWorkflowTrigger v1.1 | `workflowInputs.values: [{name:"order", type:"object"}]` |
| 2 | Validate | code v2 (runOnceForAllItems) | JS below |
| 3 | Valid? | if v2.3 | `{{ $json.ok }}` boolean is true |
| 4 | Products | httpRequest v4.2 | GET `https://api.airtable.com/v0/__AIRTABLE_BASE_ID__/__TBL_PRODUCTS__` query `filterByFormula={{ $json.formula }}`, `fields[]` = Sku,Name,Price,Stock,Category (5 query params named `fields[]`) |
| 5 | Customer | httpRequest | GET `.../__TBL_CUSTOMERS__` query `filterByFormula=LOWER({Email})='{{ $('Validate').first().json.emailLower }}'`, `maxRecords=1` |
| 6 | Last Customer | httpRequest | GET `.../__TBL_CUSTOMERS__?fields[]=CustomerId&sort[0][field]=CustomerId&sort[0][direction]=desc&maxRecords=1` |
| 7 | Last Order | httpRequest | GET `.../__TBL_ORDERS__?fields[]=OrderNumber&sort[0][field]=OrderNumber&sort[0][direction]=desc&maxRecords=1` |
| 8 | Last Invoice | httpRequest | GET `.../__TBL_INVOICES__?fields[]=InvoiceNumber&sort[0][field]=InvoiceNumber&sort[0][direction]=desc&maxRecords=1` |
| 9 | Compute | code v2 | JS below |
| 10 | In Stock? | if v2.3 | `{{ $json.ok }}` is true |
| 11 | New Customer? | if v2.3 | `{{ $json.newCustomer }}` is true |
| 12 | Create Customer | httpRequest | POST `.../__TBL_CUSTOMERS__` json body `{{ JSON.stringify({fields: $json.customerFields, typecast: true}) }}` |
| 13 | Carry | set v3.4 (mode raw) | `{{ $('Compute').first().json }}` — both branches of 11 join here (true → 12 → 13, false → 13) |
| 14 | Create Order | httpRequest | POST `.../__TBL_ORDERS__` body `{{ JSON.stringify({fields: $json.orderFields, typecast: true}) }}` |
| 15 | Create Invoice | httpRequest | POST `.../__TBL_INVOICES__` body `{{ JSON.stringify({fields: $('Compute').first().json.invoiceFields, typecast: true}) }}` |
| 16 | Decrement Stock | httpRequest | PATCH `.../__TBL_PRODUCTS__` body `{{ JSON.stringify({records: $('Compute').first().json.stockUpdates, typecast: true}) }}` — skip when empty via `alwaysOutputData` + IF? Simpler: Compute always outputs at least `[]`; Airtable rejects empty records → guard with IF "Has Stock Updates?" (`{{ $('Compute').first().json.stockUpdates.length > 0 }}`) true → 16 → 17, false → 17 |
| 17 | Email Customer | gmail v2.1 | `sendTo={{ $('Compute').first().json.customer.email }}`, `subject=אישור הזמנה {{ $('Compute').first().json.orderNumber }} — איי.איי אלקטרוניקה`, `emailType=html`, `message={{ $('Compute').first().json.emailHtml }}`, `options.appendAttribution=false`, credential `__CRED_GMAIL__` |
| 18 | Notify Manager | telegram v1.2 | chatId `__OWNER_CHAT_ID__`, text `{{ $('Compute').first().json.telegramText }}`, `additionalFields.appendAttribution=false`, credential `__CRED_TELEGRAM_MANAGER__` |
| 19 | Confirm Order | httpRequest | PATCH `.../__TBL_ORDERS__/{{ $('Create Order').first().json.id }}` body `{"fields":{"Status":"confirmed"}}` |
| 20 | Result | set v3.4 (mode raw) | `{{ $('Compute').first().json.result }}` |
| 21 | Result Error | set v3.4 (mode raw) | `{{ $json.result }}` — fed by Valid?=false and In Stock?=false |

Connections: 1→2→3; 3 true→4→5→6→7→8→9→10; 3 false→21; 10 true→11; 10 false→21; 11 true→12→13; 11 false→13; 13→14→15→"Has Stock Updates?"; true→16→17; false→17; 17→18→19→20. Settings: `executionOrder v1`, `errorWorkflow __WF_ERROR_ID__`. Gmail node: `continueOnFail: true` is **not** set (a failed email must alert the manager via Error workflow, but the order already exists — acceptable; documented in runbook).

- [ ] **Step 1: Write the Validate Code node**

```javascript
// Validate — קלט אחד, פלט אחד. לא זורק שגיאות: מחזיר ok:false עם הודעה בעברית.
const o = $input.first().json.order || {};
const c = o.customer || {};
const errs = [];
const name = String(c.name || '').trim();
const email = String(c.email || '').trim().toLowerCase();
const phone = String(c.phone || '').trim();
const address = String(c.address || '').trim();
const city = String(c.city || '').trim();
const note = String(o.note || '').trim().slice(0, 500);
if (name.length < 2) errs.push('שם חסר');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errs.push('אימייל לא תקין');
if (!/^0\d{1,2}-?\d{7}$/.test(phone.replace(/\s/g, ''))) errs.push('טלפון לא תקין');
const rawItems = Array.isArray(o.items) ? o.items : [];
if (rawItems.length === 0) errs.push('העגלה ריקה');
if (rawItems.length > 20) errs.push('עד 20 שורות בהזמנה');
const items = [];
for (const it of rawItems) {
  const sku = String(it.sku || '').trim().toUpperCase();
  const qty = Math.floor(Number(it.qty));
  if (!/^[A-Z0-9-]{3,20}$/.test(sku)) { errs.push('מק"ט לא תקין: ' + sku); continue; }
  if (!(qty >= 1 && qty <= 99)) { errs.push('כמות לא תקינה עבור ' + sku); continue; }
  const dup = items.find((x) => x.sku === sku);
  if (dup) dup.qty += qty; else items.push({ sku, qty });
}
if (errs.length) return [{ json: { ok: false, result: { ok: false, error: errs.join(', ') } } }];
const formula = 'OR(' + items.map((i) => "{Sku}='" + i.sku.replace(/'/g, "\\'") + "'").join(',') + ')';
return [{ json: { ok: true, customer: { name, email, phone, address, city }, note, items, formula, emailLower: email.replace(/'/g, "\\'") } }];
```

- [ ] **Step 2: Write the Compute Code node**

```javascript
// Compute — מאחד קטלוג, לקוח, מספור. מחיר תמיד מהקטלוג. מחזיר פריט אחד עם כל מה שהצמתים הבאים צריכים.
const v = $('Validate').first().json;
const catalog = ($('Products').first().json.records || []).map((r) => ({ id: r.id, ...r.fields }));
const bySku = Object.fromEntries(catalog.map((p) => [p.Sku, p]));
const SERVICE = 'שירותים';
const round2 = (n) => Math.round(n * 100) / 100;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const fmt = (n) => Number(n).toLocaleString('he-IL', { minimumFractionDigits: 2 }) + ' ₪';

const missing = v.items.filter((i) => !bySku[i.sku]).map((i) => i.sku);
if (missing.length) return [{ json: { ok: false, result: { ok: false, error: 'מוצר לא קיים: ' + missing.join(', ') } } }];

const lines = v.items.map((i) => { const p = bySku[i.sku]; return { sku: p.Sku, name: p.Name, qty: i.qty, price: Number(p.Price) || 0, service: p.Category === SERVICE, stock: p.Stock, recId: p.id }; });
const outOfStock = lines.filter((l) => !l.service && (Number(l.stock) || 0) < l.qty).map((l) => ({ sku: l.sku, name: l.name, available: Number(l.stock) || 0 }));
if (outOfStock.length) return [{ json: { ok: false, result: { ok: false, error: 'חלק מהפריטים אינם במלאי בכמות המבוקשת', outOfStock } } }];

const hasPhysical = lines.some((l) => !l.service);
if (hasPhysical && (v.customer.address.length < 3 || v.customer.city.length < 2)) return [{ json: { ok: false, result: { ok: false, error: 'כתובת ועיר נדרשות למשלוח' } } }];

const subtotal = round2(lines.reduce((s, l) => s + l.qty * l.price, 0));
const shipping = !hasPhysical || subtotal >= 300 ? 0 : 29;
const total = round2(subtotal + shipping);
const vat = round2(total - total / 1.18);
const amount = round2(total / 1.18);

const next = (recs, field, prefix) => { const last = (recs[0]?.fields?.[field] || `${prefix}-0000`); const n = parseInt(String(last).split('-')[1], 10) || 0; return `${prefix}-${String(n + 1).padStart(4, '0')}`; };
const existing = ($('Customer').first().json.records || [])[0];
const customerId = existing ? existing.fields.CustomerId : next($('Last Customer').first().json.records || [], 'CustomerId', 'CUST');
const orderNumber = next($('Last Order').first().json.records || [], 'OrderNumber', 'ORD');
const invoiceNumber = next($('Last Invoice').first().json.records || [], 'InvoiceNumber', 'INV');

const items = lines.map(({ sku, name, qty, price }) => ({ sku, name, qty, price }));
const itemsJson = JSON.stringify(items);
const trackUrl = `https://__STORE_DOMAIN__/orders/${orderNumber}`;
const rows = lines.map((l) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${esc(l.name)} <span style="color:#888;font-size:12px" dir="ltr">${esc(l.sku)}</span></td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${l.qty}</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${fmt(l.qty * l.price)}</td></tr>`).join('');
const emailHtml = `<!doctype html><html lang="he" dir="rtl"><body style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:600px;margin:0 auto;padding:24px"><h1 style="font-size:22px;margin:0 0 4px">תודה, ${esc(v.customer.name)}!</h1><p style="color:#555;margin:0 0 20px">ההזמנה <strong dir="ltr">${orderNumber}</strong> התקבלה. זו הדגמה — לא בוצע חיוב.</p><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f5f5f5"><th style="text-align:right;padding:8px 12px">פריט</th><th style="padding:8px 12px">כמות</th><th style="text-align:right;padding:8px 12px">סה"כ</th></tr></thead><tbody>${rows}</tbody></table><table style="width:100%;margin-top:12px"><tr><td style="color:#555">ביניים</td><td style="text-align:left">${fmt(subtotal)}</td></tr><tr><td style="color:#555">משלוח</td><td style="text-align:left">${shipping ? fmt(shipping) : 'חינם'}</td></tr><tr><td style="font-weight:bold;font-size:18px;padding-top:8px">סה"כ לתשלום</td><td style="text-align:left;font-weight:bold;font-size:18px;padding-top:8px">${fmt(total)}</td></tr><tr><td style="color:#888;font-size:12px" colspan="2">כולל מע"מ ${fmt(vat)}</td></tr></table>${hasPhysical ? `<p style="margin-top:20px">משלוח ל: ${esc(v.customer.address)}, ${esc(v.customer.city)}</p>` : ''}<p style="margin-top:20px"><a href="${trackUrl}" style="background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">מעקב הזמנה</a></p><p style="color:#888;font-size:12px;margin-top:28px">איי.איי אלקטרוניקה · חשבונית מס ${invoiceNumber} תישלח בנפרד</p></body></html>`;
const telegramText = `🛒 הזמנה חדשה ${orderNumber}\n${v.customer.name} · ${v.customer.phone}\n${lines.map((l) => `• ${l.name} ×${l.qty}`).join('\n')}\nסה"כ ${fmt(total)}${shipping ? ' (כולל משלוח)' : ''}\nחשבונית ${invoiceNumber}`;

return [{ json: {
  ok: true, newCustomer: !existing, orderNumber, invoiceNumber, customer: v.customer,
  customerFields: { CustomerId: customerId, Name: v.customer.name, Email: v.customer.email, Phone: v.customer.phone },
  orderFields: { OrderNumber: orderNumber, CustomerId: customerId, Name: v.customer.name, Email: v.customer.email, Phone: v.customer.phone, Address: v.customer.address, City: v.customer.city, Items: itemsJson, Subtotal: subtotal, Shipping: shipping, Vat: vat, Total: total, Status: 'new', InvoiceNumber: invoiceNumber, Note: v.note },
  invoiceFields: { InvoiceNumber: invoiceNumber, CustomerId: customerId, Amount: amount, Items: itemsJson, Status: 'new' },
  stockUpdates: lines.filter((l) => !l.service).map((l) => ({ id: l.recId, fields: { Stock: (Number(l.stock) || 0) - l.qty, InStock: (Number(l.stock) || 0) - l.qty > 0 } })),
  emailHtml, telegramText,
  result: { ok: true, orderNumber, invoiceNumber, total, subtotal, shipping, vat, items },
} }];
```

`__STORE_DOMAIN__` is a new string key in `n8n/config.json` (add `"STORE_DOMAIN": "ai-electronics.vercel.app"` now; update after the store deploys — the import script substitutes every string key).

- [ ] **Step 3: Assemble `n8n/workflows/10-order.json`**

Name: `WF10 — הזמנה מהחנות`. Build the JSON by hand following the node table (copy parameter shapes from `08-invoice-pdf.json` for HTTP/Telegram and `03-sales-cold-email.json` for Gmail; the Set "raw" shape from `13-api.json` node `Payload`; the Code node shape: `{"type":"n8n-nodes-base.code","typeVersion":2,"parameters":{"jsCode":"..."}}`). Keep JS in the JSON as a string (escape newlines as `\n`; write the file with the Write tool or a python `json.dump`, never sed).

- [ ] **Step 4: Import, activate, smoke-test the validation branch from n8n**

Run: `n8n/scripts/import-workflow.sh n8n/workflows/10-order.json --activate`
Expected: `WF10 — הזמנה מהחנות  id=...  active=true` and `ORDER` appears in `n8n/config.json`.

- [ ] **Step 5: Commit**

```bash
git add n8n/workflows/10-order.json n8n/config.json
git commit -m "feat(n8n): WF10 order sub-workflow (stock, order, customer, invoice, email, telegram)"
```

---

### Task 4: WF13 — `order` and `order_status` actions

**Files:**
- Modify: `n8n/workflows/13-api.json`
- Create: `n8n/scripts/order-test.sh`
- Modify: `docs/runbook.md`

**Interfaces:**
- Consumes: WF10 (`__WF_ORDER_ID__`), table id `__TBL_ORDERS__`.
- Produces: `POST /webhook/erp` with `{action:"order", order:{...}}` → WF10 result JSON (HTTP 200 always; `ok` tells success). `{action:"order_status", orderNumber, email}` → `{ok:true, order:{orderNumber,status,items,subtotal,shipping,total,created,invoiceNumber,pdfUrl}}` or `{ok:false,error:"ההזמנה לא נמצאה"}`.

- [ ] **Step 1: Add two Switch rules**

In node `Route` add rules with `outputKey` `order` and `order_status` (same condition shape as `create`, comparing `{{ $json.body.action }}`). Keep the fallback output last.

- [ ] **Step 2: Add the order branch nodes**

| Node | Type | Parameters |
|---|---|---|
| Order Input | set v3.4 | assignment `order` (type object) = `{{ $json.body.order }}` |
| Place Order | executeWorkflow v1.2 | workflowId `__WF_ORDER_ID__`, `workflowInputs.mappingMode defineBelow`, value `{order: "={{ $json.order }}"}`, schema `[{id:"order", displayName:"order", type:"object", required:false, defaultMatch:false, display:true, canBeUsedToMatch:true}]` |
| Respond Order | respondToWebhook v1.1 | json `{{ JSON.stringify($json) }}` |

Connections: Route[order] → Order Input → Place Order → Respond Order.

- [ ] **Step 3: Add the order_status branch nodes**

| Node | Type | Parameters |
|---|---|---|
| Find Order | httpRequest v4.2 | GET `https://api.airtable.com/v0/__AIRTABLE_BASE_ID__/__TBL_ORDERS__`, query `filterByFormula` = `=AND({OrderNumber}='{{ String($json.body.orderNumber || '').replace(/[^A-Z0-9-]/gi, '') }}', LOWER({Email})='{{ String($json.body.email || '').toLowerCase().replace(/'/g, "\\'") }}')`, `maxRecords=1`, Airtable credential |
| Find Invoice | httpRequest | GET `.../__TBL_INVOICES__` query `filterByFormula` = `={InvoiceNumber}='{{ ($json.records?.[0]?.fields?.InvoiceNumber || '').replace(/'/g, '') }}'`, `fields[]=PdfUrl`, `fields[]=Status`, `maxRecords=1` |
| Respond Status | respondToWebhook v1.1 | json: `={{ (() => { const o = $('Find Order').first().json.records?.[0]; if (!o) return JSON.stringify({ ok: false, error: 'ההזמנה לא נמצאה' }); const f = o.fields; const inv = $json.records?.[0]?.fields || {}; let items = []; try { items = JSON.parse(f.Items || '[]'); } catch (e) {} return JSON.stringify({ ok: true, order: { orderNumber: f.OrderNumber, status: f.Status, items, subtotal: f.Subtotal, shipping: f.Shipping, total: f.Total, created: f.Created, invoiceNumber: f.InvoiceNumber || null, pdfUrl: inv.PdfUrl || null, invoiceStatus: inv.Status || null } }); })() }}` |

Connections: Route[order_status] → Find Order → Find Invoice → Respond Status. Find Invoice must have `alwaysOutputData: true` so a missing order still reaches Respond Status.

- [ ] **Step 4: Import**

Run: `n8n/scripts/import-workflow.sh n8n/workflows/13-api.json --activate`
Expected: `WF13 — API  id=kn53i73OcuCaz3SZ  active=true`.

- [ ] **Step 5: Write order-test.sh**

```bash
#!/usr/bin/env bash
# order-test.sh [happy|oos|bad|status ORD-0001 email]  — בדיקות ל-WF13 order / order_status
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
call() { curl -s -m 120 -X POST "https://$NGROK_DOMAIN/webhook/erp" -H "Content-Type: application/json" -H "x-erp-secret: $N8N_WEBHOOK_SECRET" -d "$1"; echo; }
EMAIL=${TEST_EMAIL:-felixk2404@gmail.com}
case "${1:-happy}" in
  happy)  call "{\"action\":\"order\",\"order\":{\"customer\":{\"name\":\"בדיקה חנות\",\"email\":\"$EMAIL\",\"phone\":\"050-0000000\",\"address\":\"הרצל 1\",\"city\":\"תל אביב\"},\"items\":[{\"sku\":\"TY-HP-200\",\"qty\":1},{\"sku\":\"TY-CB-HD21\",\"qty\":2}],\"note\":\"הזמנת בדיקה\"}}" ;;
  service) call "{\"action\":\"order\",\"order\":{\"customer\":{\"name\":\"בדיקה שירות\",\"email\":\"$EMAIL\",\"phone\":\"050-0000000\"},\"items\":[{\"sku\":\"TY-SRV-01\",\"qty\":1}]}}" ;;
  oos)    call "{\"action\":\"order\",\"order\":{\"customer\":{\"name\":\"בדיקה מלאי\",\"email\":\"$EMAIL\",\"phone\":\"050-0000000\",\"address\":\"א\",\"city\":\"ב\"},\"items\":[{\"sku\":\"TY-HP-200\",\"qty\":999}]}}" ;;
  bad)    call '{"action":"order","order":{"customer":{"name":"x","email":"nope","phone":"1"},"items":[]}}' ;;
  status) call "{\"action\":\"order_status\",\"orderNumber\":\"$2\",\"email\":\"${3:-$EMAIL}\"}" ;;
esac
```

- [ ] **Step 6: Run the tests**

Run: `chmod +x n8n/scripts/order-test.sh && n8n/scripts/order-test.sh bad` → `{"ok":false,"error":"שם חסר, אימייל לא תקין, טלפון לא תקין, העגלה ריקה"}`.
Run: `n8n/scripts/order-test.sh oos` → `{"ok":false,"error":"חלק מהפריטים...","outOfStock":[{"sku":"TY-HP-200",...}]}`.
Run: `airtable/show-records.sh Products "{Sku}='TY-HP-200'"` and note Stock (S).
Run: `n8n/scripts/order-test.sh happy` → `{"ok":true,"orderNumber":"ORD-0001","invoiceNumber":"INV-0003",...}`.
Verify: Products TY-HP-200 Stock = S−1; Orders has ORD-0001 Status `confirmed`; Invoices has INV-0003 with Items; Telegram message arrived (ask Felix); email arrived at the test address (ask Felix). Within 2 minutes: INV-0003 `generated` with PdfUrl (WF1+WF8).
Run: `n8n/scripts/order-test.sh status ORD-0001` → `{"ok":true,"order":{...,"pdfUrl":"https://drive..."}}`; with a wrong email → `{"ok":false,"error":"ההזמנה לא נמצאה"}`.
Run: `n8n/scripts/order-test.sh service` → ok, shipping 0, no stock change, no address required.

- [ ] **Step 7: Runbook + commit**

Add to `docs/runbook.md` section 7 table: `| WF10 הזמנה מהחנות | Execute Workflow (מ-WF13 order) | n8n/scripts/order-test.sh happy|oos|bad|service|status ORD-000N |` and in section 5.x: "מלאי התחלתי: `airtable/seed-stock.sh`". Note: "אם המייל נכשל (OAuth פג) ההזמנה כבר נשמרה; ההתראה מגיעה בטלגרם; Reconnect Gmail ולסמן confirmed ידנית".

```bash
n8n/scripts/export-workflows.sh
git add n8n/workflows/13-api.json n8n/scripts/order-test.sh docs/runbook.md n8n/workflows/exported
git commit -m "feat(n8n): WF13 order and order_status actions + order-test script"
```

---

### Task 5: Support agent — live stock tool and store rules

**Files:**
- Modify: `n8n/workflows/05b-support-core.json`
- Modify: `n8n/prompts/customer-service.md`

**Interfaces:**
- Produces: tool `check_stock` on the Support Agent returning `{records:[{fields:{Name,Sku,Price,Stock,Category,InStock}}]}` for a query string.

- [ ] **Step 1: Add the tool node**

```json
{
  "name": "check_stock",
  "type": "n8n-nodes-base.httpRequestTool",
  "typeVersion": 4.2,
  "position": [520, 480],
  "parameters": {
    "toolDescription": "בדיקת מלאי ומחיר חיים מהמערכת. קלט: מק\"ט (למשל TY-HP-200) או מילה מהשם (למשל אוזניות). מחזיר שם, מק\"ט, מחיר בשקלים כולל מע\"מ, כמות במלאי (Stock) וקטגוריה. שירותים (קטגוריה 'שירותים') תמיד זמינים.",
    "method": "GET",
    "url": "https://api.airtable.com/v0/__AIRTABLE_BASE_ID__/__TBL_PRODUCTS__",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "airtableTokenApi",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        { "name": "filterByFormula", "value": "=OR(FIND(LOWER('{{ $fromAI('query', 'מק\"ט או מילה מהשם של המוצר', 'string').replace(/'/g, '') }}'), LOWER({Sku})), FIND(LOWER('{{ $fromAI('query', 'מק\"ט או מילה מהשם של המוצר', 'string').replace(/'/g, '') }}'), LOWER({Name})))" },
        { "name": "fields[]", "value": "Name" }, { "name": "fields[]", "value": "Sku" }, { "name": "fields[]", "value": "Price" },
        { "name": "fields[]", "value": "Stock" }, { "name": "fields[]", "value": "Category" }, { "name": "fields[]", "value": "InStock" },
        { "name": "maxRecords", "value": "5" }
      ]
    },
    "options": {}
  },
  "credentials": { "airtableTokenApi": { "id": "__CRED_AIRTABLE__", "name": "Airtable ERP" } }
}
```

Connection: `"check_stock": {"ai_tool": [[{"node": "Support Agent", "type": "ai_tool", "index": 0}]]}`. If n8n rejects `$fromAI` inside a query value on import, move the expression to `url` as a full query string (`=https://api.airtable.com/v0/.../__TBL_PRODUCTS__?maxRecords=5&fields[]=Name&fields[]=Sku&fields[]=Price&fields[]=Stock&fields[]=Category&filterByFormula={{ encodeURIComponent("OR(FIND(LOWER('" + $fromAI('query','מק"ט או מילה מהשם','string').replace(/'/g,'') + "'),LOWER({Sku})),FIND(LOWER('" + $fromAI('query','מק"ט או מילה מהשם','string').replace(/'/g,'') + "'),LOWER({Name})))") }}`) with `sendQuery: false`.

- [ ] **Step 2: Update the prompt**

Replace the first two paragraphs of `n8n/prompts/customer-service.md` with:

```
אתה נציג שירות הלקוחות של איי.איי אלקטרוניקה (AI Electronics), חנות אלקטרוניקה ישראלית שמוכרת רק מוצרים מקוריים עם אחריות יבואן רשמי. אתה עונה ללקוחות בטלגרם ובצ'אט באתר החנות.
יש לך שלושה כלים: products_catalog (חיפוש סמנטי בקטלוג: שמות, מק"ט, תיאורים, למציאת מוצרים מתאימים), check_stock (מלאי ומחיר חיים מהמערכת לפי מק"ט או מילה מהשם — חובה לפני שאומרים "יש במלאי" או מציינים כמות), ו-knowledge_base (מדיניות: משלוחים, החזרות, אחריות, תשלומים, שעות). לכל שאלה על מוצר או המלצה — products_catalog ואז check_stock לדגמים שאתה מציע. לכל שאלה על מדיניות — knowledge_base. אל תמציא מחירים, מלאי, זמני אספקה או תנאים.
חוקי החנות: כל המחירים כוללים מע"מ 18%. משלוח 29 ₪, חינם בהזמנה מעל 300 ₪, ושירותים (התקנה, תיקון, אבחון) ללא משלוח. אם Stock הוא 0 — אמור שהמוצר אזל והצע חלופה מאותה קטגוריה עם check_stock. אל תציין כמויות מלאי מיוזמתך — רק "במלאי" או "אזל". אם הלקוח שואל במפורש כמה יש, מותר לענות עם המספר מ-check_stock. שירותים תמיד זמינים. קנייה באתר: הלקוח מוסיף לסל ומסיים בקופה; מעקב הזמנה בעמוד "מעקב" עם מספר ההזמנה והאימייל.
```

Keep the rest (גבולות, טון) unchanged.

- [ ] **Step 3: Import and test**

Run: `n8n/scripts/import-workflow.sh n8n/workflows/05b-support-core.json --activate`
Run: `n8n/scripts/api-test.sh '{"action":"support","message":"יש במלאי אוזניות TY-HP-200? כמה עולה?","sessionId":"t1"}'`
Expected: reply names the product, the real price, and the current Stock number (compare with `airtable/show-records.sh Products "{Sku}='TY-HP-200'"`).
Run: `n8n/scripts/api-test.sh '{"action":"support","message":"אני רוצה את המסך 34 אינץ","sessionId":"t2"}'` (a Stock=0 product) → reply says it is out of stock and suggests another monitor.
Run: `n8n/scripts/executions.sh "WF5-core" 1` (or the workflow name in the table) → shows `check_stock` was called (tool node has output).

- [ ] **Step 4: Commit**

```bash
n8n/scripts/export-workflows.sh
git add n8n/workflows/05b-support-core.json n8n/prompts/customer-service.md n8n/workflows/exported
git commit -m "feat(n8n): support agent gets live check_stock tool and store rules"
```

---

### Task 6: Manager agent knows about orders

**Files:**
- Modify: `n8n/workflows/09b-manager-core.json`
- Modify: `n8n/prompts/manager.md`

- [ ] **Step 1: Add nodes**

After `Aggregate Tasks` insert: `Search Orders` (airtable v2.2 search on `__TBL_ORDERS__`, returnAll, alwaysOutputData true) → `Summarize Orders` (summarize v1.1: sum `fields.Total`, count `fields.OrderNumber`, split by `fields.Status`, continueIfFieldNotFound) → `Aggregate Orders` (aggregateAllItemData → `orders`) → `Build Context`. Rewire: `Aggregate Tasks → Search Orders`, `Aggregate Orders → Build Context`.

In `Build Context`, extend the `data` JSON with:
```
orders_by_status: $('Aggregate Orders').first().json.orders,
orders_today: $('Search Orders').all().filter(i => (i.json.fields?.Created || '').slice(0,10) === $now.toFormat('yyyy-MM-dd')).length,
orders_today_total: $('Search Orders').all().filter(i => (i.json.fields?.Created || '').slice(0,10) === $now.toFormat('yyyy-MM-dd')).reduce((s,i) => s + (i.json.fields?.Total || 0), 0),
recent_orders: $('Search Orders').all().slice(-5).map(i => ({ n: i.json.fields?.OrderNumber, name: i.json.fields?.Name, total: i.json.fields?.Total, status: i.json.fields?.Status }))
```

- [ ] **Step 2: Prompt**

Append to `n8n/prompts/manager.md`: `הנתונים כוללים גם הזמנות מהחנות (orders_by_status, orders_today, orders_today_total, recent_orders). "הזמנות" = הזמנות חנות; "חשבוניות" = מסמכי מס. סטטוסים: new/confirmed/shipped/delivered/cancelled.`

- [ ] **Step 3: Import and test**

Run: `n8n/scripts/import-workflow.sh n8n/workflows/09b-manager-core.json --activate`
Run: `n8n/scripts/api-test.sh '{"action":"chat","message":"כמה הזמנות היו היום ומה הסכום?"}'` → mentions the count from Task 4 tests and the total.

- [ ] **Step 4: Commit**

```bash
n8n/scripts/export-workflows.sh
git add n8n/workflows/09b-manager-core.json n8n/prompts/manager.md n8n/workflows/exported
git commit -m "feat(n8n): manager agent sees store orders"
```

---

### Task 7: End-to-end verification and cleanup

- [ ] **Step 1: Full chain once more**

Run `n8n/scripts/order-test.sh happy` and within 2 minutes confirm: Orders confirmed, Invoice generated with PdfUrl (`airtable/show-records.sh Invoices "{InvoiceNumber}='INV-000N'"`), stock decremented, Telegram + email seen by Felix, `order_status` returns pdfUrl. Run `n8n/scripts/executions.sh "WF10" 3` → all success.

- [ ] **Step 2: Reset demo data**

Delete the test orders/invoices/customers created by `order-test.sh` (names starting with "בדיקה") with `airtable/api.sh DELETE`, and restore the stock of TY-HP-200 / TY-CB-HD21 (`airtable/api.sh PATCH "/Products/<recId>" '{"fields":{"Stock":N}}'`). Keep ORD numbering as is (gaps are fine).

- [ ] **Step 3: Docs + memory + commit**

Update `tasks/todo.md` (plan 5 done), `docs/demo.md` (add "הזמנה מהחנות" step placeholder pointing to plan 6). Commit `docs: plan 5 review`.
