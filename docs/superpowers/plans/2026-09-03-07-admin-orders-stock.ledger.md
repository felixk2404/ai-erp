# SDD ledger — plan: 
Ruling: work on main directly (no worktree) — prior plans in this repo ran on main by the owner's choice and other sessions share the tree; cost if wrong: a broken main between commits.
Preflight scan: T1/T2 both edit app/src/lib/types.ts (different types, one small edit each — run sequentially, T2 after T1); T1 owns airtable.ts TableName; T3 consumes Order type from T1. No contradictions found.
Task 1: dispatched (BASE 001c345, implementer opus)
Task 1: implementer DONE (ef719f2). Ruling: status label for `new` is the store's "התקבלה", not the plan's "חדשה" — the plan names the store file as source of truth and contradicts itself; cost if wrong: one label. Ruling: CustomerId lookup by list(max:1) accepted (CUST-… ids are text, never record ids); setOrderStatus(id, orderNumber, status) accepted.
Task 2: dispatched (BASE ef719f2, implementer sonnet)
Task 1: review Needs fixes — F1 Important (new label), F2/F4/F5/F6 minor; fix round 1/5 dispatched to original implementer (all five).
Task 1: fix round 1/5 (5 applied by implementer, commit d31a358; scoped re-review dispatched sonnet)
Ruling: Task 3 dispatched while Task 2 runs — disjoint files (insights.ts, (app)/page.tsx vs products/*); cost if wrong: a merge conflict in the working tree.
Task 3: dispatched (BASE d31a358, implementer sonnet)
Task 1: fix round 1/5 (5 addressed, 0 open; commits ef719f2..d31a358)
Task 1: minor (deferred): invalid ?status= silently falls back to all without URL cleanup; layout.tsx count filter relies on Airtable omitting blank fields.
Task 1: complete (commits 001c345..d31a358, review clean after 1 round)
Task 3: implementer DONE (9851c2c); review dispatched sonnet
Task 3: minor (deferred): order with invalid Created is skipped silently (invoices/leads push an item); no test for missing Status fallback.
Task 3: complete (commits d31a358..9851c2c, review clean)
Task 2: implementer DONE (96b7733, 7fd9369). Ruling: WF13 field allow-list gained Stock — required, accepted. Ruling: the new-product dialog must take Stock too (concern 3) and the now-unreachable toggleStock is to be deleted (concern 2) — both go to the fix round; cost if wrong: one dialog field. Review dispatched opus.
Task 2: review Approved-with-fixes — F1/F2 Important (create dialog Stock, dead toggleStock), F3/F4/F6 minor; fix round 1/5 dispatched to original implementer. minor (deferred): F5 no server-side service guard in setStock; F7 stock cell not dir=ltr/text-end; grid view has no stock affordance (table only).
Task 2: fix round 1/5 (6 addressed, 0 open; commits 7fd9369..57c9ab5)
Task 2: minor (deferred): service create with an invalid Stock string is still rejected by the shared schema before the category branch strips it; WF13 InStock allow-list entry now redundant.
Task 2: complete (commits 9851c2c..57c9ab5, review clean after 1 round)
Final review: dispatched opus over 001c345..HEAD
Final review: Needs fixes — Important: to-ship must be gated on the open WF10 ship task; minors: runbook counts/attention bullet, attention-list empty copy, get() encodeURIComponent. Design review: Not approved — B1 mobile products table clips the stock field, B2 order detail has no focal point (reuse invoice timeline, primary next-step button); S1–S13 should-fix. One fix wave dispatched (opus, BASE 5ae0016).
Fix wave: all addressed (856ec37, 24742bf), re-review clean. Parked (rulings): row shortcut new→shipped skips confirmed — Ruling: leave; WF10 creates orders as confirmed so new is rare, and the strict lifecycle lives on the detail page — cost if wrong: one skipped state on a rare order. Cancelled order announces step 0 as error to screen readers — Ruling: leave, the visible sentence carries the truth; a11y minor. Products table scrolls at 768–1023 — Ruling: accepted trade for readable columns. invoices/[id] has the same min-width grid latent bug — Ruling: out of scope, noted in todo.
Plan complete: 001c345..24742bf
