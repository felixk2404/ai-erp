# Task for Codex: Google credential watchdog (WF-Health)

**Repo:** https://github.com/felixk2404/ai-erp · branch `main` · start from commit `fa3427a` or later.
**Read first:** `README.md`, `docs/runbook.md` (§3, §6, §7), `n8n/scripts/import-workflow.sh`, `n8n/workflows/00-error.json`, `n8n/workflows/08-invoice-pdf.json` (Drive node example), `n8n/workflows/03-sales-cold-email.json` (Gmail node example), `n8n/scripts/add-sticky-notes.py`, `tasks/lessons.md`.

## The problem

WF4 (`n8n/workflows/04-sales-replies.json`, Gmail Trigger polling every 30 min) stopped running on 2026-09-08 22:00 UTC and nobody was told for seven days. Cause: the Google OAuth app is in "Testing" mode, so the refresh token expires after 7 days. n8n logged

```
There was a problem in 'Gmail Trigger' node in workflow '5cQhVanCfhxM16ru':
'Access could not be refreshed because the connected account has revoked access, the refresh token expired, or the account password or permissions changed. Open the credential and reconnect it to continue.'
```

but **n8n does not route a polling trigger's own failure to the workflow's `errorWorkflow`** — only failures of regular nodes reach WF-Error. So the Telegram alerting that covers everything else is blind to exactly this failure. The same credential pair (`Gmail ERP`, `Google Drive ERP`) is used by WF3 (send cold email) and WF8 (upload invoice PDF); those only fail when they reach the Google node, i.e. late and only if there is work.

Reconnecting the credential is a browser OAuth flow that only the owner can do. Your job is not to reconnect — it is to make sure the owner finds out within an hour, every time, with a message that says what to click.

## What to build

### 1. `n8n/workflows/11-google-health.json` — "WF-Health — בריאות Google"

A scheduled workflow whose only purpose is to touch both Google credentials with a **regular node** every hour, so that an auth failure becomes an ordinary node error and flows into WF-Error → Telegram.

Nodes, in order:

1. `Every Hour` — `n8n-nodes-base.scheduleTrigger` v1.2, `rule.interval[0] = { field: "hours", hoursInterval: 1 }`.
2. `Gmail Probe` — `n8n-nodes-base.gmail` v2.1, the cheapest read available on that node version (label list, or a message list with `returnAll: false, limit: 1`). Credential `gmailOAuth2` = `{ "id": "__CRED_GMAIL__", "name": "Gmail ERP" }`. `retryOnFail: true, maxTries: 2, waitBetweenTries: 5000` (it is a read, so retry is safe; two tries absorb a network blip but do not delay a real auth failure much).
3. `Drive Probe` — `n8n-nodes-base.googleDrive` typeVersion 3 (what WF8 uses), list files in folder `__DRIVE_FOLDER_ID__` with `limit: 1`. Credential `googleDriveOAuth2Api` = `{ "id": "__CRED_DRIVE__", "name": "Google Drive ERP" }`. Same retry settings.
4. `Healthy` — `n8n-nodes-base.set` v3.4 producing `{ ok: true, checkedAt: {{ $now.toISO() }} }`.

Settings: `{ "executionOrder": "v1", "errorWorkflow": "__WF_ERROR_ID__" }`. Leave `onError` at its default (stop workflow) on both probes — a failure **must** abort the run so WF-Error fires. Do not add `continueOnFail`/`continueErrorOutput` here.

Add a `notes` field (Hebrew) on each probe node explaining why it exists, in the style of the other workflows. Add the workflow to `NOTES` in `n8n/scripts/add-sticky-notes.py` (key `11-google-health`) and run the script so the file gets its sticky note like all the others.

Placeholders: use only names that already exist in `n8n/config.json` (`__CRED_GMAIL__`, `__CRED_DRIVE__`, `__DRIVE_FOLDER_ID__`, `__WF_ERROR_ID__`). `import-workflow.sh` fills them and refuses to import if any `__X__` remains. It will register the new workflow id in `config.json` under `workflows.GOOGLE_HEALTH` (derived from the filename) — commit that change.

### 2. Make the alert say what to do

WF-Error's Telegram text (`00-error.json`, node `Telegram Owner`) currently prints workflow name, node and raw error. Add one line, conditional, so that when the error message contains `Access could not be refreshed` or `reconnect` the message ends with:

```
🔑 טוקן Google פג. n8n → Credentials → Gmail ERP / Google Drive ERP → Reconnect.
```

Keep it inside the existing expression (no new node) and keep the HTML escaping that is already there. The classifier in `n8n/code/transient-error.js` already returns `false` for this message (there is a test pinning it), so it will not be filtered.

### 3. Docs

- `README.md`: add a `WF-Health` row to the workflow table (Hebrew, one line: "בודק כל שעה שטוקני Gmail ו-Drive חיים; כשל → התראה עם הוראת Reconnect").
- `docs/runbook.md` §7 table: add the row with how to test it ("להריץ ידנית; עם טוקן פג — התראה בטלגרם תוך דקה").
- `docs/runbook.md` §6, the trap that starts with `**WF4 שקט ימים, בלי שום התראה:**` (added 2026-09-15): append one sentence that WF-Health now catches this within an hour.
- `docs/runbook.md` §3 (Google OAuth): add a bullet that the permanent fix is moving the OAuth consent screen from **Testing** to **In production** in Google Cloud (project `gen-lang-client-0155888723`, client `n8n-erp`); in Testing the refresh token dies every 7 days by design. This is an owner action, not code — say so.
- `app/src/lib/workflows.ts`: the admin dashboard draws a system map from this manifest (currently 14 entries). Add the new workflow with the id from `config.json`, `role: 'auto'`, a Hebrew `hint`. Then recount: `ls n8n/workflows/*.json | wc -l` and update every place README/app README state a workflow count (`grep -rn "13 workflows\|שלושה עשר\|13 תבניות" README.md app/README.md docs/`).

### 4. Verification (do all, paste the evidence in the PR description)

1. `python3 -c "import json;json.load(open('n8n/workflows/11-google-health.json'))"` and `python3 n8n/scripts/add-sticky-notes.py` → file has exactly one sticky note.
2. `cd n8n && ./scripts/import-workflow.sh workflows/11-google-health.json --activate` → prints `active=true`. Then `./scripts/import-workflow.sh workflows/00-error.json`.
3. **Live negative test — the Gmail token is expired right now (as of 2026-09-15), so the first real run must fail and alert.** Run the workflow once from the n8n UI (or wait for the top of the hour). Expected: WF-Health execution `error` at `Gmail Probe`; a WF-Error execution `success` ending at `Telegram Owner`; the owner's Telegram shows the message with the 🔑 line. Record the two execution ids in `tasks/todo.md`.
4. After the owner reconnects the credentials (not you), run once more: WF-Health `success`, all four nodes green. Record the id.
5. `cd n8n/code && node --test` → all pass (you should not need to change any code node; if you do, add a test first).
6. `cd app && pnpm test && pnpm typecheck && pnpm lint` (for the manifest change).
7. `cd n8n && bash scripts/export-workflows.sh` and commit `n8n/workflows/exported/` — that directory must mirror the live instance.

## Repo rules you must follow

- Never edit `n8n/workflows/exported/*` by hand; edit the numbered template and re-export.
- `retryOnFail` only on idempotent nodes (reads/updates). Never on sends or creates.
- Hebrew for node `notes`, sticky notes and docs; English for commit messages, conventional prefix (`feat(n8n): …`), body explains *why*. End every commit message with `Co-Authored-By: Codex <noreply@openai.com>`.
- No secrets in any file. `n8n/.env` is gitignored and a local hook blocks reading it; scripts self-load it. `n8n/config.json` holds ids only.
- Keep the change small: one new workflow, one expression edit in WF-Error, docs, manifest. Do not refactor anything else you notice — open an issue instead.
- Do not deactivate or re-import workflows you did not touch. Do not run `docker compose down`.
- Before claiming done, run every verification step above and quote the output. "Should work" is not evidence in this repo (see `tasks/lessons.md`).

## Out of scope (say so in the PR if tempted)

- Reconnecting OAuth (owner only).
- A generic "workflow X has not run for N hours" watchdog via the n8n public API — a good follow-up, but it needs an API key inside n8n and is not required to catch this failure.
- Moving conversation memory off `memoryBufferWindow`, DocType on invoices, tasks due dates — all listed as deliberate deviations in the README.
