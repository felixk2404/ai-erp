# AI Electronics ERP — Brand Film Script (v2)

Status: v1 approved by Felix 2026-09-02. v2.1 (2026-09-04): cold open matches the real order timestamp (12:21, Friday), "the store does one thing" (the Server Action sends, not the browser), and a plainer closing line. v2 re-synced to the system as of 2026-09-03 (plans 6 and 7 shipped, Telegram catalog menu, human task queue, support handoff). Production not started.

## Brief

- Length: 3:45 (hard cap 4:00). v1 was 3:30; the shipped features added three beats' worth of material.
- Language: English narration, English captions burned in. Hebrew UI shown as-is.
- Voice: AI narrator (ElevenLabs), first person, as Felix. Calm, confident, documentary tone. Not salesy.
- Point of view: behind the scenes. The film exists to **explain and show how the process actually works**, not to sell a product.
- Spine: one customer order followed end to end through every layer, then the parts of the system that need a human, then the three AI agents.
- Depth: architecture and flows. Real n8n canvases, real Airtable rows, real execution logs. No source code on screen, no test runner.
- Felix does not appear. Name card at the end.
- Style: dark "night console" palette matching the admin app (void / signal blue / readout). Motion graphics over real captures. Apple / Linear register. Every effect must explain something; no decorative particles, glitch or lens flares.
- Budget: motion graphics rendered locally with HyperFrames (free). One AI clip only (logo reveal) on Higgsfield. Narration, music and SFX from ElevenLabs.

## Hard rule: show, don't claim

Every sentence in the narration must be backed on screen by a **real capture** of the thing it describes, at the moment it is said:

| Narration claims | Must show |
|---|---|
| storefront checkout sends a payload | real checkout click on ai-electronics-one.vercel.app + the request payload (styled overlay of the real JSON) |
| WF13 routes, WF10 validates / decrements / creates / opens a task | the real n8n canvases **and** the execution view with green nodes for this exact order |
| rows land in Airtable | the real Orders / Customers / Invoices / Tasks rows for this exact order number |
| WF1 adds VAT, WF8 renders PDF via Gotenberg to Drive | WF1 and WF8 execution views, the HTML-to-PDF node, the PDF opened in Drive (shipping line + VAT-inclusive summary visible) |
| customer gets email with tracking link, PDF appears on the tracking page | the real Gmail message, then /orders/ORD-XXXX on the storefront with the PDF link lit |
| Felix gets Telegram | the real Telegram message (same order number as the cold open) |
| dashboard flags the order to ship, marking shipped closes the task | admin /orders/[id] status change new → shipped, the Tasks row flipping to done, the attention panel item disappearing |
| support bot: catalog buttons, "interested" creates a lead, handoff to a human | Telegram @aielec_support_bot: /menu, category → product → "מעוניין" → phone → Leads row; then a free-text "I want to talk to a person" → WF5-handoff execution → Lead + Task + owner Telegram |
| support agent grounded in catalog / vector store | website widget or Telegram answering a stock question, then the Supabase table with embeddings |
| manager agent answers revenue / unpaid | the real Telegram or ⌘K conversation |
| sales agent drafts and sends outreach | WF3 execution + the sent Gmail |
| morning brief writes itself | real streaming capture |

All numbers (order number, amount, city, test counts) are placeholders until capture day and must be replaced by the real values from the recorded order.

## Beat sheet

| # | Time | On screen | Motion / sound |
|---|---|---|---|
| 1 | 0:00–0:12 | Black. Phone. Telegram notification arrives: "הזמנה חדשה ORD-XXXX · ₪X,XXX" | Notification sound in silence, slow push-in, ambient rises |
| 2 | 0:12–0:20 | Titanium logo reveal, title AI ELECTRONICS ERP / behind the scenes | The only AI-generated clip. Music enters on the hit |
| 3 | 0:20–0:42 | Storefront: product page ("במלאי" badge), add to cart, checkout form with the "הדגמה — לא מתבצע חיוב" banner, submit | 3D device mockup, zoom on the button, the JSON payload lifts off the screen as a glowing object and flies right |
| 4 | 0:42–1:12 | n8n canvas: WF13 (front door) routes to WF10. Nodes light in narration order: validate, decrement stock, upsert customer, create order, create invoice, create task. Then the execution view, green ticks | JSON lands on the Webhook node, glowing line travels node to node, floating labels per step. The task node gets a distinct amber pulse: "this one is for a human" |
| 5 | 1:12–1:35 | Airtable: 6 tables in an isometric grid; new rows enter Orders, Customers, Invoices, Tasks | White flash per new row, ID links drawn between tables (OrderNumber ↔ InvoiceNumber ↔ CustomerId ↔ Task RefId) |
| 6 | 1:35–2:02 | WF1 validates, WF8 builds RTL HTML, Gotenberg, PDF opens in Drive. Email to customer with tracking link, tracking page lights up with the PDF, Telegram to manager | PDF "folds" out of the HTML; cut to /orders/ORD-XXXX; zoom into Telegram: the same message as the cold open. Loop closes |
| 7 | 2:02–2:22 | Admin app: dashboard attention panel "לשלוח ORD-XXXX", orders tab, order page, status → shipped, task closes | Tilt + parallax, the attention item slides out as the status flips. Stock column with LEDs in the products tab, one count dropping |
| 8 | 2:22–2:57 | Three-agent montage. Support: Telegram catalog buttons → "מעוניין" → lead row, then a handoff request → task + owner alert; website widget answering a stock question, cut to Supabase embeddings. Manager: "מה לא שולם?" answered. Sales: WF3 sends a Hebrew email | Split-screen panels open one after another; counter: 34 products |
| 9 | 2:57–3:15 | Admin morning: brief streaming, n8n live feed, ⌘K chat | Zoom to ⌘K, streamed text types itself |
| 10 | 3:15–3:35 | Full architecture diagram assembles | Components land as named, arrows flow; counters roll: 15 / 6 / 3 / 2 / 2 / tests |
| 11 | 3:35–3:45 | End card: name, links, logo | Music fades, hold 3 s |

## Narration (v2, ~560 words)

**[1]** It's 12:21 on a Friday. A customer in Haifa just ordered a pair of headphones. Nobody on my team touched anything. Let me show you what happened in the twelve seconds before that message.

**[2]** This is AI Electronics ERP. Here's how it works, behind the scenes.

**[3]** It starts in the showroom. A storefront I built in Next.js: thirty-four products, live search, real stock. When the customer checks out, the store does one thing. It sends a single JSON payload to a single endpoint.

**[4]** That endpoint is an n8n workflow. Workflow thirteen is the front door. Every action from every app passes through it, authenticated by a shared secret and routed by name. "Order" hands off to workflow ten. It validates the cart, decrements stock, creates the customer if they're new, and writes the order and its invoice. Then it does something I care about: it opens a task. "Ship this order to Haifa." The system knows what it can't do, and it puts that on a list for a human. Send the same checkout twice, and it returns the order it already created. No duplicates.

**[5]** Everything lands in Airtable. Six tables. Orders, invoices, customers, products, leads, tasks. Every status is a plain word. Every relation is an ID. That's boring on purpose. Fifteen workflows read and write these tables all day, and none of them step on each other.

**[6]** The new invoice row wakes up workflow one, which checks the numbers and confirms the eighteen percent VAT. Workflow eight then renders a Hebrew, right-to-left tax invoice as HTML, ships it to Gotenberg, and files the PDF in Google Drive. The customer gets an email with a tracking link, and the PDF shows up on their order page. I get a Telegram. That's the message you saw.

**[7]** In the admin app, that order is already waiting for me. The dashboard flags anything unshipped for more than a day. I open the order, mark it shipped, and the task closes itself. Stock is live in the same place, with a warning light when a product runs low.

**[8]** But the order was the easy part. Three AI agents work the same data. The support agent lives on Telegram and on the website. Customers can browse the catalog with buttons, tap "interested", leave a phone number, and a lead lands in Airtable with an alert to me. Or they can just talk to it. It's grounded in the full product catalog, embedded into Supabase's vector store, so it knows what's in stock and what it costs. Ask for a discount, and it politely refuses. Ask for a human, and it hands you off: a lead, a task, a message to me. The manager agent answers my questions: revenue this month, what's unpaid, what needs attention. And the sales agent drafts Hebrew outreach to new leads, sends it, and notices when they reply.

**[9]** When I open the app in the morning, the brief is already writing itself. Live revenue, open invoices, a feed of every workflow run, and a chat with the manager agent one keystroke away.

**[10]** Under the hood: fifteen n8n workflows. Six Airtable tables. Three agents, two Telegram bots, two Next.js apps on Vercel, a vector store, a PDF engine, and a test suite that runs before anything ships.

**[11]** One order. Fifteen workflows. Every step automated, every decision visible. Built by Felix Kreinovich.

## Changes from v1

- Workflow count 14 → 15 (WF5-handoff added). Counters and narration updated.
- New beat 7 (admin orders): orders tab, order page, status lifecycle, task auto-close, unshipped >24h flag, stock LEDs. Plan 7 shipped 2026-09-03.
- Beat 4 gained the human task queue ("ship this order", low-stock reorder task) and idempotent checkout.
- Beat 6 gained the customer tracking page (/orders/ORD-N) and the tax-invoice arithmetic (shipping line, VAT-inclusive summary).
- Beat 8 (agents) gained the Telegram catalog menu with lead capture and the human handoff.
- Closing line changed from "zero manual steps" to "zero manual steps that the system didn't ask for", because the task queue is now a feature, not an absence.
- "359 tests" removed from narration; the counter on screen shows the real numbers on capture day (runbook 2026-09-03: admin 118 Vitest + 11 Playwright, store 9 Playwright + Vitest).
- Length 3:30 → 3:45.

## Open items before production

- Beat 8 is the densest (35 s for three agents plus the menu and the handoff). If it feels rushed, cut the sales agent to one sentence or move the catalog menu into beat 3.
- Replace placeholders (order number, amount, city, test counts) with values from the actual recorded order.
- Rename customer CUST-0002 "בדיקה חנות" and remove the e2e order ORD-0008 before capture (tasks/todo.md).
- Decide where n8n runs on capture day (Mac + ngrok is fine for capture; the todo about hosting n8n off the Mac matters for submission, not for the film).
- Test-record one Hebrew RTL capture inside HyperFrames before building everything.

## Next step

Production plan (storyboard of 12 still frames for approval, capture checklist, asset list, HyperFrames composition structure, sound plan). Storyboard stills are approved before any video render.
