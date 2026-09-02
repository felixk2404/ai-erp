# AI Electronics ERP — Brand Film Script (v1)

Status: script approved by Felix 2026-09-02. Production not started.

## Brief

- Length: 3:30 (hard cap 4:00).
- Language: English narration, English captions burned in. Hebrew UI shown as-is.
- Voice: AI narrator (ElevenLabs), first person, as Felix. Calm, confident, documentary tone. Not salesy.
- Point of view: behind the scenes. The film exists to **explain and show how the process actually works**, not to sell a product.
- Spine: one customer order followed end to end through every layer, with a detour to the three AI agents.
- Depth: architecture and flows. Real n8n canvases, real Airtable rows, real execution logs. No source code on screen, no test runner.
- Felix does not appear. Name card at the end.
- Style: dark "night console" palette matching the admin app (void / signal blue / readout). Motion graphics over real captures. Apple / Linear register. Every effect must explain something; no decorative particles, glitch or lens flares.
- Budget: motion graphics rendered locally with HyperFrames (free). One AI clip only (logo reveal) on Higgsfield. Narration, music and SFX from ElevenLabs.

## Hard rule: show, don't claim

Every sentence in the narration must be backed on screen by a **real capture** of the thing it describes, at the moment it is said:

| Narration claims | Must show |
|---|---|
| storefront checkout sends a payload | real checkout click + the request payload (devtools network or a styled overlay of the real JSON) |
| WF13 routes, WF10 validates / decrements / creates | the real n8n canvases **and** the execution view with green nodes for this exact order |
| rows land in Airtable | the real Orders / Customers / Invoices rows for this exact order number |
| WF1 adds VAT, WF8 renders PDF via Gotenberg to Drive | WF1 and WF8 execution views, the HTML-to-PDF node, the PDF opened in Drive |
| customer gets email, Felix gets Telegram | the real Gmail message and the real Telegram message (same order number as the cold open) |
| support agent grounded in catalog / vector store | Telegram or website chat answering a stock question, then the Supabase table with embeddings |
| manager agent answers revenue / unpaid | the real Telegram or ⌘K conversation |
| sales agent drafts and sends outreach | WF3 execution + the sent Gmail |
| dashboard brief writes itself | real streaming capture |

All numbers (order number, amount, city, test count) are placeholders until capture day and must be replaced by the real values from the recorded order.

## Beat sheet

| # | Time | On screen | Motion / sound |
|---|---|---|---|
| 1 | 0:00–0:12 | Black. Phone. Telegram notification arrives: "הזמנה חדשה ORD-XXXX · ₪X,XXX" | Notification sound in silence, slow push-in, ambient rises |
| 2 | 0:12–0:20 | Titanium logo reveal, title AI ELECTRONICS ERP / behind the scenes | The only AI-generated clip. Music enters on the hit |
| 3 | 0:20–0:45 | Storefront: product page, add to cart, checkout, submit | 3D device mockup, zoom on the button, the JSON payload lifts off the screen as a glowing object and flies right |
| 4 | 0:45–1:10 | n8n canvas: WF13 (front door) routes to WF10. Nodes light in narration order. Then the execution view, green ticks | JSON lands on the Webhook node, glowing line travels node to node, floating labels: validate, stock, order, invoice |
| 5 | 1:10–1:35 | Airtable: 6 tables in an isometric grid; new row enters Orders, Customers, Invoices | White flash per new row, ID links drawn between tables |
| 6 | 1:35–2:00 | WF1 validates, WF8 builds HTML, Gotenberg, PDF opens in Drive. Email to customer, Telegram to manager | PDF "folds" out of the HTML; zoom into Telegram: the same message as the cold open. Loop closes |
| 7 | 2:00–2:30 | Three-agent montage: support bot answering from RAG (cut to Supabase table), manager bot "what's unpaid?", sales agent sending an email | Split-screen panels open one after another; counter: 34 products |
| 8 | 2:30–2:55 | Admin app: dashboard, morning brief streaming, n8n live feed, ⌘K chat | Slight tilt, parallax between cards, zoom to ⌘K |
| 9 | 2:55–3:15 | Full architecture diagram assembles | Components land as named, arrows flow; counters roll: 14 / 6 / 3 / 2 / 359 |
| 10 | 3:15–3:30 | End card: name, links, logo | Music fades, hold 3 s |

## Narration (v1, ~500 words)

**[1]** It's 9:14 on a Tuesday morning. A customer in Haifa just ordered a pair of headphones. Nobody on my team touched anything. Let me show you what happened in the four seconds before that message.

**[2]** This is AI Electronics ERP. Here's how it works, behind the scenes.

**[3]** It starts in the showroom. A storefront I built in Next.js: thirty-four products, live search, real stock levels. When the customer checks out, the browser does one thing. It sends a single JSON payload to a single endpoint.

**[4]** That endpoint is an n8n workflow. Workflow thirteen is the front door. Every action from every app passes through it, authenticated by a shared secret and routed by name. "Order" hands off to workflow ten, which validates the cart, decrements stock, creates the customer if they're new, and writes the order and its invoice. Four steps, one transaction, no human.

**[5]** Everything lands in Airtable. Six tables. Orders, invoices, customers, products, leads, tasks. Every status is a plain word. Every relation is an ID. That's boring on purpose. Fourteen workflows read and write these tables all day, and none of them step on each other.

**[6]** The new invoice row wakes up workflow one, which checks the numbers and adds eighteen percent VAT. Workflow eight then renders a Hebrew, right-to-left invoice as HTML, ships it to Gotenberg, and files the PDF in Google Drive. The customer gets an email. I get a Telegram. That's the message you saw.

**[7]** But the order was the easy part. Three AI agents work the same data. The support agent answers customers on Telegram and on the website, grounded in the full product catalog, embedded into Supabase's vector store, so it knows what's in stock and what it costs. Ask for a discount, and it politely refuses. The manager agent answers me: revenue this month, what's unpaid, what needs attention. And the sales agent drafts Hebrew outreach to new leads, sends it, and notices when they reply.

**[8]** When I open the admin app in the morning, the brief is already writing itself. Live revenue, open invoices, a feed of every workflow run, and a chat with the manager agent one keystroke away.

**[9]** Under the hood: fourteen n8n workflows. Six Airtable tables. Three agents, two Telegram bots, two Next.js apps on Vercel, a vector store, a PDF engine, and three hundred fifty-nine tests that pass before anything ships.

**[10]** One order. Fourteen workflows. Zero manual steps. Built by Felix Kreinovich.

## Open items before production

- Beat 7 is the densest (30 s for three agents). May take 10 s from beat 8 if the montage feels rushed.
- Replace placeholders (order number, amount, city, test count) with values from the actual recorded order.
- Storefront (plan 6) must be finished and the system frozen before capture day.
- Test-record one Hebrew RTL capture inside HyperFrames before building everything.

## Next step

Production plan (storyboard of 12 still frames for approval, capture checklist, asset list, HyperFrames composition structure, sound plan). Storyboard stills are approved before any video render.
