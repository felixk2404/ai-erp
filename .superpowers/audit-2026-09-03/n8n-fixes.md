# n8n audit — fixes

**Date:** 2026-09-03 · **Scope:** all Criticals in `n8n.md`, the real Importants, the invoice-PDF injection from `security.md`.
**Method:** edits to `n8n/workflows/*.json` only, imported through `n8n/scripts/import-workflow.sh`, verified with the n8n MCP (`validate_node_config`, `get_workflow_details`, `test_workflow`) and with real executions. Nothing was edited in the n8n UI. No customer email, no Telegram send to the owner, no Drive file created. One Airtable record was created to prove the WF8 claim and deleted afterwards.

**Result: 6/6 Critical fixed · 8/11 Important fixed, 3 skipped · 2 Minors fixed in passing · security.md C2 fixed, I4 documented.**

---

## Table

| id | verdict | why |
|---|---|---|
| **C1** error workflow can't deliver its own alerts | **FIXED** | `Telegram Owner` gets `retryOnFail` 3 × 5000 ms plus an error branch that writes a Task to Airtable, so an undelivered alert leaves a record instead of vanishing. |
| **C2** WF8 re-triggers on invoices it is already processing | **FIXED** | `Claim Invoice` stamps `Invoices.PdfLockedAt` immediately after selection; the search filter skips claimed rows. Interval 1 min → 5 min, `limit` 5 → 1, retries on Airtable and Gotenberg. |
| **C3** reindex deletes the vector store before it can rebuild | **FIXED** | WF6/WF7 reordered to read → delete → carry → insert. A `Carry` Code node re-anchors the items the HTTP node discards. |
| **C4** agent failures hang the caller / silence Telegram | **FIXED** | `onError: continueErrorOutput` on WF13 `Support Core`, `Manager Core`, `Update Record`, `Create Record` → one `Respond Server Error` (502). WF5/WF9 agent error output wired back into the existing `Send Reply`. |
| **C5** WF13 create/update is an unrestricted write proxy | **FIXED** | `Route` allowlists tables (`Tasks/Products/Invoices/Leads/Customers`) and, for `update`, field names (`Status/InStock`); everything else falls to the 400. The record id is now `encodeURIComponent`-ed. |
| **C6** order/invoice numbering has no idempotency key | **FIXED** (ceiling documented) | `Compute` returns the existing order when the last order matches email + cart + under 5 minutes, without writing. `Last Order` now returns the whole record. Residual: two genuinely simultaneous checkouts can still both write — Airtable has no uniqueness constraint. |
| **I1** `pairedItem` after Aggregate / N+1 scan | **SKIPPED** | The proven half (execution 576's `Multiple matches found`) is already fixed in the file. The prescribed remainder — hoist `Numbered Invoices` above the loop and derive numbers with `$runIndex` — would **introduce gaps in the INV sequence**, because only invoices that pass `Is Valid` get numbered while `$runIndex` counts every invoice. That is a worse defect on a tax-document sequence than an N+1 scan over a few dozen rows, and it does not fix the concurrency race the finding names. |
| **I2** a failed poll silently drops records forever | **FIXED** | `retryOnFail` 3 × 5000 ms on WF1 `Find Customer` and WF2 `Same Email Or Phone`, plus the Airtable writes in both chains. The structural trigger replacement was not done — out of the finding's smallest fix. |
| **I3** agent states stock without calling `check_stock` | **FIXED** | The `במלאי:` line is gone from the embedded product text in `07-products-embed.json`. The catalog can no longer answer availability. |
| **I4** prompt promises lead capture no tool can perform | **SKIPPED — conflict** | Both options land in `n8n/prompts/customer-service.md`, which another agent is rewriting this session. Not touched. |
| **I5** `continueIfFieldNotFound` on the money sums | **FIXED** | Dropped from `Summarize Invoices` and `Summarize Orders`. Kept on Leads and Tasks, per the finding. |
| **I6** zero retry configuration in the project | **FIXED** (priority set) | Retries added in the order the finding gives: WF-Error `Telegram Owner`, WF5-core `Support Agent`, WF8 `Gotenberg PDF`, then the Airtable nodes in WF1, WF2, WF3, WF8, WF13, WF9-core. Not a blanket sweep of all ~30 network nodes; deliberately **not** added to `Send Email` (Gmail), where a retry after a successful send that failed to respond would email the lead twice. |
| **I7** WF3 double-send + empty webhook answer | **FIXED** | `Mark Contacted` moved before `Send Email`; `alwaysOutputData` on `Next New Lead` plus `Has Lead?` and a `No Lead` node returning `{ok: true, sent: 0}`. |
| **I8** one-alert-per-minute storm | **FIXED via C2** | The 5-minute interval plus the claim removes the storm at its source. The optional `onError` on `Gotenberg PDF` was not added — a PDF outage should still be loud once. |
| **I9** WF13 returns 200 on error and on not-found | **FIXED** | `Respond Order Error` → 502. `Respond Status` computes 200 / 404 / 502 inline. |
| **I10** WF10's writes aren't transactional, order confirmed last | **FIXED** | `Confirm Order` moved to run after every write and before both notifications. |
| **I11** Telegram bot token interpolated into a URL | **SKIPPED — not achievable as prescribed** | The Telegram Bot API carries the token as a **URL path segment**. No n8n credential type can inject a path segment: header/query credentials cannot, and `telegramApi` defines no `authenticate` block so it is not offered to HTTP Request at all. The native Telegram node can't send the dynamic inline keyboard, which is exactly why the raw `httpRequest` nodes exist (`docker-compose.yml:19`). Real mitigation is M8's `EXECUTIONS_DATA_PRUNE`, which bounds how long the token sits in the executions DB — left for a human. |
| **M6** `Find Order` reports an outage as "not found" | **FIXED** | Inside the `Respond Status` expression that I9 was already rewriting: an error-shaped `Find Order` item now yields 502 + "השירות לא זמין", not "ההזמנה לא נמצאה". |
| **M9** VAT line can render `NaN%` | **FIXED** | Divisor guarded in the `Build HTML` expression that security C2 was already editing. |
| M1, M2, M3, M4, M5, M7, M8 | **SKIPPED** | Minors, and none is a one-key change inside a file this pass was already editing. M8 (`EXECUTIONS_DATA_PRUNE`, `N8N_CONCURRENCY_PRODUCTION_LIMIT`, `depends_on: condition: service_healthy`) is `docker-compose.yml`, not a workflow. |
| **security.md C2** WF8 `Build HTML` HTML/JS injection | **FIXED** | `Name`, `Email`, `Phone` and the `CustomerId` fallback wrapped in the same `[<>&]` escape the item rows already use — at the sink, as the finding prescribes. |
| **security.md I4** invoice PDFs world-readable on Drive | **DOCUMENTED, unchanged** | Per the controller ruling. One line added to `docs/runbook.md` § מלכודות recording that the customer's order page links to their invoice, there is no customer login, the data is synthetic, and real customer data would need short-lived signed URLs. |

---

## Evidence

### C1 — WF-Error
Live config read back: `retries: ["Telegram Owner", "Log Undelivered"]`, `onErr: ["Telegram Owner"]`. `validate_node_config` on `Log Undelivered` → `valid: true`. The 16 prior failures (executions 827 … 157, all `ENOTFOUND api.telegram.org`) are the baseline this absorbs.

### C2 — WF8 claim, real Airtable proof
Temporary invoice `recIMkcMw5XKu9oh6` (`Status: 'pintest'`, so WF1's `Is New` and WF8's selection both ignore it), queried with the exact new `filterByFormula`:

| state | rows selected |
|---|---|
| no claim | **1** |
| `PdfLockedAt` = now | **0** — a second run takes nothing |
| `PdfLockedAt` = 20 min ago | **1** — the lease expires, a crashed run doesn't strand the invoice |

Deleted afterwards: `{"deleted":true,"id":"recIMkcMw5XKu9oh6"}`, and a follow-up GET returns `INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND`.

Interval evidence: successful single-invoice runs measured **64–312 s** (executions 860 = 64 s, 885 = 111 s, 884 = 115 s, 863 = 117 s, 882 = 124 s, 468 = 312 s) against a 60 s poll — the poll was shorter than the work. Live after the change: executions 1420, 1430, 1440 at 23:20 / 23:25 / 23:30, 5 minutes apart, all `success`.

`validate_node_config` on `Claim Invoice` → `valid: true`.

### C3 — reindex order
`rag-count.sh` before: `policy: 79`, `product: 34`. Both webhooks run, `{"ok":true,"products":34}` / `{"ok":true,"chunks":79}` (HTTP 200), count after: identical. Node order from the executions:

- **Execution 1412** (WF6): `Reindex Webhook` → `Read Policy Files` (12 items) → `Delete Old Policies` → `Carry Files` (12 items restored) → `Supabase Insert` (79) → `Done`.
- **Execution 1411** (WF7): `Reindex Webhook` → `Search Products` (34) → `Delete Old Products` → `Carry Products` (34) → `Product Text` (34) → `Supabase Insert` (34) → `Done`.

The delete now cannot run unless the read has already produced items, and the `Carry` node proves the items survive the HTTP node that replaces them.

### C4 / C5 / I9 / M6 — WF13, live requests
| request | result |
|---|---|
| `update` on table `Orders` | `400` `{"ok":false,"error":"unknown action, or table/fields not allowed: update Orders"}` |
| `update` on `Invoices` with `payload.Total` | `400`, same shape |
| `update` on `Invoices`, allowed field, non-existent record id | `502` `{"ok":false,"error":"השירות לא זמין כרגע. נסו שוב בעוד רגע."}` — the error branch answers instead of hanging |
| `order_status` for an order that doesn't exist | `404` `{"ok":false,"error":"ההזמנה לא נמצאה"}` |
| `order_status`, found path (execution **1419**, pinned lookups) | `Respond Status` executed with no error on both the code and body expressions |

`get_workflow_details(kn53i73OcuCaz3SZ)` confirms all four fallible nodes carry `onError: "continueErrorOutput"` with `main[1]` wired to `Respond Server Error`, and that `Respond Server Error` returns `responseCode: 502`.

### C4 — WF5 / WF9
Live read-back: WF5 `onErr: ["Support Core"]`, WF9 `onErr: ["Manager Core"]`, both error outputs wired into the existing `Send Reply`, whose fallback text ("מצטערים, לא הצלחנו לענות כרגע." / "לא התקבלה תשובה") now actually runs. No Hebrew string was touched in WF5 — the conflict rule was respected; the only WF5 edits are `onError`, a node note, and `retryOnFail`.

### C6 / I10 — WF10
- **Execution 1429** — resubmitted checkout (same email, same cart, previous order 44 s old). `Compute` short-circuited; the run touched only `Validate → Valid? → Products → Customer → Last Customer → Last Order → Last Invoice → Compute → In Stock? → Result Error`. `Create Order` and `Create Invoice` never ran. Output: `{"ok":true,"duplicate":true,"orderNumber":"ORD-0042","invoiceNumber":"INV-0042",…}`.
- **Execution 1431** — same input with the previous order aged to 1 h. Full path ran, output `{"ok":true,"orderNumber":"ORD-0043","invoiceNumber":"INV-0043","total":129}`, and the node order shows `Decrement Stock → Confirm Order → Email Customer → Notify Manager`, i.e. I10's reordering.

### I7 — WF3
**Execution 1435**, empty queue: only `Run Now Webhook → Next New Lead → Has Lead? → No Lead` ran, returning `{"ok":true,"sent":0}`. `Sales Agent` and `Send Email` never executed. Live connections confirm the new order: `Next New Lead → Has Lead? → Sales Agent → Mark Contacted → Send Email → Result`.

### security.md C2 — the injection
**Execution 1414**, WF8 with a hostile customer record pinned in. `Build HTML` output:

```html
לכבוד</strong><div>&lt;img src=x onerror=fetch('//evil.tld')&gt;</div>
<div class="muted">a&lt;script&gt;@x.com 050&amp;1234567</div>
```

Gotenberg's Chromium receives inert text. No Airtable write, no Drive file, no PDF — every credentialed node was pinned.

---

## Commits

| sha | subject |
|---|---|
| `e68b9af` | `chore(n8n): normalise workflow JSON to 2-space formatting` — no semantic change (`jq -S` identical before and after on all 14 files); split out first so the fix diffs read as fixes |
| `0235047` | `fix(n8n): WF-Error retries its alert and records one it could not send` — C1 |
| `fac6dce` | `fix(n8n): reindex deletes the vector store only after a successful read` — C3, I3 |
| `a5a6fd4` | `fix(n8n): WF8 claims an invoice before generating its PDF` — C2, I8, M9, security C2 |
| `bfc856f` | `fix(n8n): WF13 answers the caller on every branch, and only writes to tables the app uses` — C4, C5, I9, M6 |
| `c6d4a25` | `fix(n8n): a failed agent reaches Send Reply instead of silence` — C4 (WF5, WF9) |
| `e2c85b1` | `fix(n8n): a resubmitted checkout returns the order it already created` — C6, I10 |
| `2f3ab3d` | `fix(n8n): retries on the poll chain, and money sums that fail loudly` — I2, I5, I6 |
| `0da1f9c` | `fix(n8n): WF3 marks the lead before it emails, and answers an empty queue` — I7 |
| `be74b09` | `fix(n8n): WF8 claims with a lease field, not a new invoice status` — C2 revision, security I4 documented, runbook |
| `faf25f3` | `chore(n8n): re-export the 13 workflows that changed` |

---

## Notes for a human

1. **`Invoices.PdfLockedAt` is a new Airtable field.** Added idempotently by `airtable/add-fields.sh` (field id `fld2iRWkXj5zDQlMk`). Anyone rebuilding the base from scratch gets it automatically; anyone pointing this repo at a different base must run that script before WF8 will select anything.
2. **Why not `Status = 'generating'`.** The first pass used it, and it leaked: `app/src/lib/statusMeta` would have rendered the raw English token with a dead LED, `/invoices/[id]` would have shown "אין מסמך" during the exact window the PDF is being produced, `INVOICE_STATUSES` would have needed a sixth filter chip, and `insights.ts` would have dropped the invoice out of revenue. The lease field keeps the claim inside n8n and self-releases after 15 minutes, which a stuck status would not.
3. **I11 needs an instance-level decision, not a workflow edit.** The token cannot leave the URL. `EXECUTIONS_DATA_PRUNE` in `docker-compose.yml` (M8) is the available mitigation and also addresses the webhook secret sitting in 1300+ stored executions.
4. **I4 is still open** and belongs to whoever owns `n8n/prompts/customer-service.md`: the prompt invites the customer to leave a name and phone in chat, and WF5-core has no tool that can write a Lead.
5. **C6's residual race.** The dedupe window is not a lock. Two genuinely simultaneous checkouts still both write, and `docs/runbook.md` § מלכודות records that as accepted. An Airtable autonumber field, or a lease field like WF8's, would be the real fix.
