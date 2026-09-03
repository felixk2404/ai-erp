# Plan 7 — הזמנות ומלאי באפליקציית הניהול

Spec: approved in chat 2026-09-03 (bounded design, no separate spec file). Source of truth for data: `docs/runbook.md` §7.1 (Orders fields, statuses), `airtable/create-tables.sh` (Orders schema), `store/src/lib/order-status.ts` (status labels the customer sees — the admin must use the same Hebrew labels).

## Global Constraints

- Admin app: `app/` (Next.js 16.3, React 19, Tailwind 4, shadcn base-nova with Base UI `render` prop, zod 4, Vitest, Playwright). Dev port 3100. Design system `app/.interface-design/system.md` (dark "night console": void/signal/readout tokens, `text-ink-2/3`, `StatusLed`, `Money`, `Table*`, `Header`, `EmptyState`). Follow the existing pages (`(app)/leads`, `(app)/invoices`, `(app)/customers/[id]`) for structure, RTL, `dir="ltr"` + `text-end` on Latin/numeric cells.
- Reads: `list<F>(table, {filter, sort, max})` / `get<F>(table, id)` from `@/lib/airtable` (server components, `export const dynamic = 'force-dynamic'`). Writes: only through n8n WF13 via `erpUpdate<F>(table, id, payload)` from `@/lib/n8n` — never write to Airtable directly from the app.
- `TableName` union (in `@/lib/airtable` or `@/lib/types`) must gain `'Orders'`; `statusMeta('Orders', s)` must return the store's labels: new→"חדשה" amber, confirmed→"אושרה" amber, shipped→"נשלחה" green, delivered→"נמסרה" green, cancelled→"בוטלה" red; unknown→label as-is, led off.
- WF13 (`n8n/workflows/13-api.json`) allow-lists tables for `create`/`update` — `'Orders'` must be added to the **update** list (not create), the workflow re-imported with `n8n/scripts/import-workflow.sh n8n/workflows/13-api.json --activate`, and `docs/runbook.md` §7.1/§WF13 line updated. Never run a command containing `.env`.
- Orders fields: OrderNumber, CustomerId, Name, Email, Phone, Address, City, Items (JSON string `[{sku,name,qty,price}]`, prices VAT-inclusive), Subtotal, Shipping, Vat, Total, Status, InvoiceNumber, Note, Created. Items parsing must be tolerant: malformed JSON → empty list, never a crash.
- Money via the existing `<Money>` component / `ils` formatter; dates via `dateIL`. Hebrew UI copy in the app's existing register (short, no "אנא"). Gershayim `״` in abbreviations (מק״ט, סה״כ).
- Tests: Vitest for pure logic (`*.test.ts` next to the module), Playwright smoke in `app/e2e` where the pattern exists. `pnpm typecheck && pnpm lint && pnpm test` green before every commit. Commit only the files you touched (explicit paths; other sessions share this tree). Conventional commit messages, English, `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Do not touch `store/`, WF10, or money computation.

## Task 1: Orders tab, order page, status change

**Files:** `app/src/lib/types.ts` (OrderFields, ORDER_STATUSES, Order), `app/src/lib/airtable.ts` (TableName), `app/src/lib/status.ts`, `app/src/lib/order-items.ts` + `.test.ts` (parseItems(json) → `{sku,name,qty,price}[]`, itemCount), `app/src/app/(app)/orders/page.tsx`, `app/src/app/(app)/orders/[id]/page.tsx`, `app/src/app/(app)/orders/actions.ts` (setOrderStatus: validates status, `erpUpdate('Orders', id, {Status})`; when the new status is `shipped`, also finds the open Task with Source `order` and RefId = OrderNumber and sets it `done` via `erpUpdate('Tasks', …)`; revalidates `/orders`, `/orders/[id]`, `/tasks`, `/`), `app/src/app/(app)/orders/status-select.tsx` (same shape as `leads/status-select.tsx`), `app/src/components/shell/sidebar.tsx` + `mobile-nav` + `nav-link.tsx` (icon `orders` → lucide `ShoppingBag`) + `hotkeys.tsx` (`o` → `/orders`) + `(app)/layout.tsx` (NavCounts.orders = orders with Status in new/confirmed), `command-menu.tsx` if it lists pages, `n8n/workflows/13-api.json` (+ re-import), `docs/runbook.md`.

**List page** `/orders`: Header "הזמנות"; status filter via `?status=` like leads (chips or select, all statuses + "הכל"); table columns: מספר הזמנה (link to `/orders/[id]`, mono, ltr), לקוח (Name; City under it muted), מוצרים (itemCount), סה״כ (Money), סטטוס (StatusLed + label), חשבונית (link `/invoices?q=INV-…` or "—"), תאריך (dateIL Created). Sort Created desc. EmptyState when none.

**Detail page** `/orders/[id]`: Header with OrderNumber + StatusLed; two-column on desktop: (1) items table (מק״ט ltr, שם, כמות, מחיר, סה״כ שורה) + totals block (ביניים, משלוח, מע״מ כלול, סה״כ); (2) customer card (Name, Email ltr, Phone ltr, Address + City, Note if any, link to `/customers/[CustomerId]` when CustomerId is a record id or "—"), invoice link, status select (OrderStatusSelect). `notFound()` when missing.

**Tests:** `order-items.test.ts` (valid JSON, malformed, empty, qty sum); `status.test.ts` gains Orders cases; actions unit test for the shipped→task-close rule if the pattern exists for leads actions (else document manual check). Playwright: `/orders` renders the table with ORD-0001 and `/orders/[id]` shows its items (read-only; do not change status in e2e).

**Manual live check (do it, record output in the report):** with dev server on 3100, change ORD-0001 status to `shipped` via the UI or the action, confirm in Airtable (`airtable/show-records.sh`) the Status changed and the ship task (if an open one exists) is done; then set it back to its original status and reopen the task if you closed it. Never leave demo data changed.

## Task 2: Stock in the products tab

**Files:** `app/src/lib/types.ts` (ProductFields.Stock?: number, Highlights?: string — one small edit), `app/src/app/(app)/products/page.tsx`, `app/src/app/(app)/products/actions.ts` (setStock(id, stock): int 0–999, `erpUpdate('Products', id, {Stock, InStock: stock > 0})` for physical products; services (Category 'שירותים') have no stock — hide the control), `app/src/components/product-card.tsx`, `app/src/app/(app)/products/stock-field.tsx` (client: number input + save on blur/Enter, pending state, toast on error; 44px hit area), `app/src/lib/stock.ts` + `.test.ts` (stockLed(stock, service) → 'green' | 'amber' (<3) | 'red' (0) | 'off' (service); parseStock(input) → int or error).

**Table view:** new column "מלאי": for physical products the StockField with a LED dot in front; for services "—". **Grid card:** small mono count with the LED ("4 במלאי" / "אזל" / "שירות"). Keep the existing InStock toggle working; saving Stock syncs InStock.

**Tests:** stock.test.ts (LED thresholds, parse rejects negatives/floats/NaN). Live check: set a product's Stock to its current value +1 and back, verify in Airtable, leave data unchanged.

## Task 3: Orders on the dashboard

**Files:** `app/src/lib/insights.ts` + `insights.test.ts` (AttentionItem kind `'to-ship'` amber: orders with Status `confirmed` (or `new`) older than 24h: title "לשלוח ORD-… — {Name}", href `/orders/[id]`; accept `orders` in `attentionItems` input, optional to keep callers compiling), `app/src/app/(app)/page.tsx` (fetch orders, pass in), any dashboard stat tile that lists counts — add "הזמנות לשליחה" only if a natural slot exists (do not redesign the dashboard).

**Tests:** insights.test.ts cases for to-ship (fresh order not listed, 25h-old confirmed listed, shipped not listed).
