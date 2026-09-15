# Task for Codex: reconnect the two Google credentials in n8n by driving the owner's Chrome

**Machine:** the owner's Mac (local). **n8n:** http://localhost:5678 (also https://goofy-glamour-syrup.ngrok-free.dev through ngrok, which is running). **Repo:** `/Users/felixkreinovich/פרויקט גמר`.

## Situation

The Google OAuth app behind n8n is in "Testing" mode, so its refresh token dies after 7 days. It died on 2026-09-15. Two n8n credentials must be re-authorised through Google's consent popup:

| credential | n8n id | card URL |
|---|---|---|
| Gmail ERP | `cZ21a0epfV1Bce6Y` | http://localhost:5678/home/credentials/cZ21a0epfV1Bce6Y |
| Google Drive ERP | `e02EpJN1iWKQubkX` | http://localhost:5678/home/credentials/e02EpJN1iWKQubkX |

The owner tried by hand and the flow stalls somewhere inside the Google popup; n8n's log shows no OAuth callback arriving at all. Your job: drive the owner's **already logged-in** Chrome through the flow, see exactly where it stalls, get past it if it is a UI obstacle, and stop cleanly if it is an authentication step.

## Hard rules

1. **Never type a password, a 2FA code, a recovery phone, or anything into a Google sign-in form.** If Google shows a sign-in/password/2FA screen, take a screenshot, stop, and hand back to the owner with the screenshot. Only the owner types those.
2. Touch only: the n8n credential pages above, the Google consent popup they open, and the grey ngrok interstitial that may appear inside that popup. Do not open Gmail, Drive, or any other tab; do not read page content beyond what is needed to click.
3. Every click is preceded by a screenshot saved to `/Users/felixkreinovich/פרויקט גמר/.playwright-mcp/reconnect-<step>.png` (that directory is gitignored). Attach them to your final report in order.
4. Do not change anything in Google Cloud Console. Do not create new credentials in n8n; only re-authorise the two above.
5. If after two full attempts the callback still does not arrive, stop and report the exact screen where it stalls.

## How to attach to the owner's Chrome

Use the Playwright MCP in **extension mode**, which drives an existing Chrome tab through the "Playwright MCP Bridge" extension (so the tab keeps the owner's Google session):

```
npx @playwright/mcp@latest --extension
```

and install the bridge extension in the owner's Chrome if it is not there yet (https://github.com/microsoft/playwright-mcp — "Playwright MCP Bridge"). When you connect, pick the tab that is already open on `localhost:5678`.

Fallback only if the extension route is impossible: Chrome DevTools Protocol. Note that current Chrome refuses `--remote-debugging-port` on the **default** profile; a fresh `--user-data-dir` will not be logged in to Google, which defeats the purpose. Do not try to copy the owner's profile directory.

## The flow, click by click

For **Gmail ERP** first, then repeat for **Google Drive ERP**:

1. Open the card URL. Expect a green box "Account connected" with **Switch account** and **Disconnect**. Screenshot `01-card`.
2. Click **Switch account**. A popup should open on `accounts.google.com`. Screenshot `02-popup`.
   - If no popup opens: Chrome blocked it. Click the blocked-popup icon at the end of the address bar → "Always allow popups from localhost:5678" → click **Switch account** again.
3. In the popup: the account chooser. Select the business Gmail account — **the one that is already listed as signed in**. If the chooser shows only "Use another account", stop (rule 1). Screenshot `03-chooser`.
4. Possible screens, in order of likelihood — handle each:
   - **"Google hasn't verified this app"** → click **Advanced** → **Go to n8n-erp (unsafe)**. Screenshot `04-unverified`.
   - **"Access blocked: n8n-erp has not completed the Google verification process"** or **"This app is blocked"** → this means the chosen account is not in the app's Test users list. Do NOT try another account. Screenshot `04-blocked`, stop, report: the owner must add that account under Google Cloud → OAuth consent screen → Test users, or pick the listed account.
   - **"Error 400: redirect_uri_mismatch"** → screenshot `04-mismatch`, stop, and also screenshot the "OAuth Redirect URL" shown at the bottom of the n8n card. Report both; the owner fixes the URI in Google Cloud.
   - Consent/permissions screen with checkboxes → tick all requested scopes if unticked → **Continue** / **Allow**. Screenshot `05-consent`.
5. After Allow, Google redirects the popup to `https://goofy-glamour-syrup.ngrok-free.dev/rest/oauth2-credential/callback?...`. The free ngrok tier shows a grey page **"You are about to visit goofy-glamour-syrup.ngrok-free.dev"** here. Click **Visit Site**. Screenshot `06-ngrok`. This is the step the owner most likely never got past.
6. The popup should close by itself and the n8n card should show "Account connected" again. Click **Save** (top right). Screenshot `07-saved`. If the card did not refresh, reload the page and confirm it is still connected, then Save.
7. Repeat 1–6 for Google Drive ERP.

## Verification (all three, quote the output)

1. Credentials were actually saved today — metadata only, no secrets:
   ```bash
   S=/tmp/n8n-copy.sqlite; docker cp n8n-n8n-1:/home/node/.n8n/database.sqlite $S && python3 -c "
   import sqlite3;c=sqlite3.connect('$S')
   for r in c.execute(\"select name,updatedAt from credentials_entity where name in ('Gmail ERP','Google Drive ERP')\"): print(r)"; rm -f $S
   ```
   Both `updatedAt` values must be 2026-09-15 (UTC).
2. The Gmail trigger initialises without an auth error:
   ```bash
   cd "/Users/felixkreinovich/פרויקט גמר/n8n"
   ./scripts/n8n-api.sh POST /workflows/5cQhVanCfhxM16ru/deactivate >/dev/null
   ./scripts/n8n-api.sh POST /workflows/5cQhVanCfhxM16ru/activate | python3 -c "import json,sys;print(json.load(sys.stdin).get('active'))"
   sleep 5; docker logs -t --since 30s n8n-n8n-1 2>&1 | grep -c "Access could not be refreshed"
   ```
   Expected: `True` then `0`.
3. Within 30 minutes a new WF4 execution appears:
   ```bash
   ./scripts/n8n-api.sh GET "/executions?workflowId=5cQhVanCfhxM16ru&limit=1" | python3 -c "import json,sys;r=json.load(sys.stdin)['data'];print(r[0]['startedAt'],r[0]['status'])"
   ```
   Expected: a 2026-09-15 timestamp, `success`.

Then append one line to `tasks/todo.md` under "סקירת תאימות למסמך הקורס (2026-09-15)": `- [x] Google credentials reconnected (Codex, <time>), WF4 execution <id>`. Commit that line only (`docs(todo): google credentials reconnected`), nothing else; screenshots stay out of git.

## Out of scope

- Moving the OAuth app from Testing to Production (owner, in Google Cloud). The 7-day expiry will recur until that is done — say so in the report.
- Anything in the Gmail inbox or Drive itself.
