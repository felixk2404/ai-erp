# SDD ledger — plan: docs/superpowers/plans/2026-09-02-05-orders-backend.md

Spec: docs/superpowers/specs/2026-09-02-storefront-design.md (read).
Branch: main, repo root (no worktree).
Ruling: work directly on main in the repo root, not a worktree — every n8n/airtable script sources the git-ignored `n8n/.env` (blocked from being copied by the secret-guard hook), and the whole project has been built this way; commits are scoped by explicit paths so parallel uncommitted `app/` work from other sessions is never swept in. Cost if wrong: a bad task commit lands on main without a branch to discard (mitigated: each task is one small commit, revertable).

## Pre-flight scan

| Pair / task | Produces vs consumes | Finding |
|---|---|---|
| T1 → T2 | `Products.Stock` (int), `Highlights` (long text) / seed writes both | consistent |
| T1 → T3 | `TBL_ORDERS` config key + Orders fields / WF10 orderFields keys | consistent (OrderNumber, CustomerId, Name, Email, Phone, Address, City, Items, Subtotal, Shipping, Vat, Total, Status, InvoiceNumber, Note) |
| T3 → T4 | WF10 input `order` object, output `result` shape / WF13 Place Order passes `order`, Respond Order returns `$json` | consistent |
| T3 → T4 | `STORE_DOMAIN` config key used in Compute | T3 adds it to config.json; import substitutes all string keys — consistent |
| T4 → T7 | order-test.sh outputs / verification steps | consistent |
| T5 | `check_stock` tool `$fromAI` in query param | plan carries a fallback (URL-encoded) if import rejects — accepted |
| T6 | Build Context uses `$('Search Orders').all()` with alwaysOutputData | if Orders empty, `.all()` returns one empty item → `fields` undefined guarded by `?.` — ok |
| T3 self | Validate error path returns `{ok:false, result}`; Result Error uses `$json.result`; Compute error paths same shape | consistent |
| T3 self | "Has Stock Updates?" IF described in prose, not numbered | fine, connections listed |
| Global | plan says do not touch `app/` | all tasks comply |

Clean. No rulings beyond the worktree one.

## Progress

Task 1: implemented by agent ad3b05e3f92619408, commit 636984e (BASE cd3d8d1). Created field pending user. Concern: verify-schema.sh EXPECTED list stale.
Task 1: minor (deferred): int() helper in create-tables.sh unused; TBL_ORDERS key order cosmetic; verify-schema.sh EXPECTED list stale (pre-existing) — fix in Task 7 cleanup.
Task 1: Created field added by user, renamed to Created (16 fields).
Task 1: complete (commits cd3d8d1..636984e, review clean)
Task 2: implemented by agent a361100701b0ec851, commit 0efdf9e (BASE 636984e). Review dispatched.
Ruling: user decision mid-plan — storefront shows only in-stock/out-of-stock, never quantities; support agent states quantity only when explicitly asked. Spec §2/§6 and plan Task 5 prompt text updated. Cost if wrong: prompt wording only.
Note: another session committed 260f0be (app/ night console) to main between Task 1 and Task 2; Task 2 review packaged from 260f0be. app/ work is now committed — plan 7 unblocked later.
Task 2: review dispatched (agent a26aa2a5d2849f276). Task 3: implementer dispatched (agent a548ec6ad4fae3147, opus, BASE 6f492b4) in parallel with Task 2 review.
Task 2: review — Approved w/ 1 Important (Highlights empty → idempotence gap) + minors (unused urllib.parse import; zeros counter run-local; missing-Sku falls back to record id; pagination path unexercised). Fix round 1 dispatched to implementer a361100701b0ec851 (FIX_BASE 0efdf9e).
Task 2: minor (deferred): zeros counter is run-local; missing-Sku uses record id for hash; multi-page pagination unexercised.
Task 2: fix round 1/5 — implementer fixed (commit bb8d83d, seed-stock.sh only; noted a concurrent process had staged a deletion of app/public/brand/logo.png — implementer reset and committed by pathspec). Scoped re-review dispatched (haiku).
Task 2: fix round 1/5 (2 addressed, 0 open; commits 0efdf9e..bb8d83d)
Task 2: complete (commits 260f0be..bb8d83d, review clean)
Task 3: implemented by agent a548ec6ad4fae3147, commit 9bfb5da (BASE bb8d83d). Implementer restarted n8n container (was wedged on SQLite mutex) — all 14 workflows verified active afterwards, healthz 200. Concerns: Decrement Stock PATCH >10 records → Airtable 422 (max lines 20 vs batch cap 10); STORE_DOMAIN placeholder; write path untested until Task 4. Review dispatched (sonnet).
Ruling (pending review confirmation): cap distinct order lines at 10 in Validate (spec says ≤20; 34-SKU demo never needs more) rather than chunking the PATCH — smallest change, keeps one-item flow. Cost if wrong: an order with >10 distinct SKUs is rejected with a clear Hebrew error. Spec §5.2 to be updated to 10.
Task 3: review — Approved w/ 2 Important plan-mandated (batch cap >10 → 422 after order exists; duplicate-SKU merge exceeds qty 99). Ruling: fix both in Validate (cap 10 distinct lines; error when merged qty > 99) — spec §5.2 and plan Global Constraints updated. Fix round 1 dispatched to a548ec6ad4fae3147 (FIX_BASE 9bfb5da).
Task 3: minor (deferred): Last* nodes use literal URL query strings (import does plain substitution — works, note in runbook); Telegram text length unbounded in theory.
Task 3: fix round 1/5 — fixed in 1739c24 (Validate only), harness verified both caps. Concern: cap message duplicated (redundant pre-loop check) → minor deferred. Scoped re-review dispatched (haiku). Task 4 implementer dispatched in parallel (opus).
Task 3: minor (deferred): redundant pre-merge rawItems.length>10 check duplicates the error message.
Task 3: fix round 1/5 (2 addressed, 0 open; commits 9bfb5da..1739c24)
Task 3: complete (commits bb8d83d..1739c24, review clean)
Task 4: implementer ab3ba5e8f712a3bc7 commit 964677e (BASE 1739c24) — bad/status-not-found pass; happy/service BLOCKED by WF10 defect: n8n collapses duplicate `fields[]` query params → Products lookup lacks Sku → "מוצר לא קיים". Ruling: WF10 Products node drops fields[] (return all fields); reopened Task 3 as fix round 2 (agent a548ec6ad4fae3147). Task 4 brief deviations accepted: happy cart uses TY-CB-UC100 (TY-CB-HD21 is a seeded Stock=0 item), oos qty 99. Cost if wrong: none functional.
Task 3: fix round 2/5 — 39fe1e6 (Products fields[] removed, verified live). Ruling: scoped re-review of this deletions-only change is folded into the Task 4 review package range (1739c24..HEAD) to avoid a redundant seat; cost if wrong: nil (live-verified query shape). Task 4 agent resumed to run happy/service/status/oos.
Task 4: implementer finished (964677e, 79face7). E2E: ORD-0001/INV-0003, ORD-0002/INV-0004, stock decremented, customer reused, email+telegram nodes ok. Review dispatched (range 1739c24..79face7 incl. WF10 fix 39fe1e6).
Ruling: new defect outside plan — WF1 fails with pairedItemMultipleMatches when ≥2 new invoices arrive in one poll (Aggregate collapses items; Compute uses $(Airtable Trigger).item). Add unplanned Task 4b: wrap WF1 body in Loop Over Items (batch 1) so each invoice is numbered/validated sequentially; then recover INV-0003/0004 by re-running the flow (not by hand-typing money). Cost if wrong: WF1 latency +1 iteration per invoice; nil.
Task 4: review — Approved w/ 1 Important (Find Order email backslash escaping + no error branch → hang). Fix round 1 dispatched to ab3ba5e8f712a3bc7. Same defect in WF10 Validate emailLower → Task 3 fix round 3 dispatched to a548ec6ad4fae3147. Ruling: Find Invoice fields[] removal approved (same n8n collapse bug); WF-Error export drift is my own 00-error fix (bb1d282) — no action.
Task 4: minor (deferred): orderNumber match is case-sensitive; order-test.sh status args unquoted in JSON (dev script).
Task 3: fix round 3/5 — f25fa82 (emailLower backslash escape, verified offline + live read-back). Ruling: fold its re-review into the final whole-branch review (1-line change, live-verified). Note: SKU formula has same pattern but unreachable (regex allow-list).
Task 4: fix round 1/5 — 2a950fc (backslash escape + onError continue; 4 hostile emails → not found in ~2s, no hang). Ruling: re-review folded into final whole-branch review. INV-0003/0004 now generated with PdfUrl after WF1 fix landed (execution 597). Task 4: complete (commits 1739c24..2a950fc, 1 fix round).
Task 4b: WF1 loop fix committed e36479d (agent a81302e3a8bd477a8 still finishing regression + cleanup). Task 5: implementer dispatched (opus) — disjoint files.
Task 4b: complete (commit e36479d; INV-0003/0004 recovered to generated with PdfUrl; regression INV-0005/0006 validated in one execution then deleted; throwaway workflow deleted).
Task 4b: minor (deferred): WF1 numbering is count-based (collides after deletions) vs WF10 max-based — align WF1 to max-based in Task 7 cleanup. Numbered Invoices returnAll inside loop = O(N) queries per poll (fine at this scale).
Task 6: implementer dispatched (sonnet) in parallel with Task 5 (disjoint files).
Task 6: implemented by a8193e55dbc53db8d, commit 40fdc0c. Also fixed latent tasks_by_status reference. Review dispatched (sonnet).
Task 5: implemented by a09595dae3b62b89b, commit 5478187. Concern: alternative product named as במלאי from RAG without check_stock (exec 618). Review dispatched (sonnet).
Task 6: review — Approved; 1 Important (whole-file reformat of 09b-manager-core.json). Ruling: parked — indent=2 json.dump is the format already used by 01/08/10 templates edited this session; no behaviour change; not worth a fix round. Cost if wrong: noisier git history for one file. Minors deferred: $now un-zoned (relies on GENERIC_TIMEZONE), recent_orders relies on insertion order.
Task 6: complete (commits 2a950fc..40fdc0c, 1 parked)
Task 5: review — Needs fixes: 1 Important (prompt does not gate אזל/alternative claims on check_stock; observed exec 618). Fix round 1 dispatched to a09595dae3b62b89b (FIX_BASE 5478187). Minor deferred: adversarial formula test (added to fix round), trailing newline.
Task 7: dispatched (sonnet) in parallel with Task 5 fix round; disjoint files. Rulings: keep ORD-0001/0002, INV-0003/0004, CUST-0002 and decremented stock as demo data (no deletion of financial records) — cost if wrong: customer named "בדיקה חנות" visible in demo (todo item to rename); WF1 numbering switched to max-based to match WF10; WF10 duplicate cap message removed.
Task 5: fix round 1/5 — 0021ffa (prompt: no availability claim without check_stock; query = SKU/single word; empty result ≠ אזל). Live-verified exec 635/638. Ruling: scoped re-review folded into final whole-branch review (prompt-only change with execution evidence). Minor deferred: alternative price from RAG not live; agent calls check_stock once for alternatives.
Task 5: complete (commits 40fdc0c..5478187 + 0021ffa, 1 fix round)
Task 7: complete (commits ee61c7c, 7669262; verify-schema OK, INV-0005 max-based regression passed, test invoice deleted). Ruling: Task 7 task-review folded into final whole-branch review. Final review dispatched (opus) over cd3d8d1..HEAD; other-session commits 260f0be/c5d132c/835fe6a excluded by instruction.
Final review (opus): With fixes — 1 Critical (no response on failure after writes; Gmail expiry), 4 Important (invoice total drift 1 agora; order_status case; spec contracts wrong; numbering race unrecorded), 10 minors. One fix-wave dispatched (opus) covering #1–#15. Ruling: keep the drift-regression order (TY-PB-20, 218 ₪) as demo data. Triage of deferred items accepted as reviewed: later/drop as listed; STORE_DOMAIN becomes plan-6 Task 14 step.
Final fix wave: 863a5c9 7aa8228 bb2d8b4 (all 15 findings; ORD-0003/INV-0005 drift case Total 218 exact). Scoped re-review dispatched (sonnet). Follow-up todo: Email Customer uses continueRegularOutput → email failure no longer alerts the manager; switch to continueErrorOutput + Telegram alert in plan 7 cleanup.
Final fix wave re-review: all 15 addressed, no new breakage. Plan 5 COMPLETE (cd3d8d1..bb2d8b4).
