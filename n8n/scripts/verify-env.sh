#!/usr/bin/env bash
# מאמת שכל הטוקנים ב-.env עובדים. מדפיס רק תוצאות, לעולם לא ערכים.
set -uo pipefail
cd "$(dirname "$0")/.." && set -a && source .env && set +a

echo "--- filled? (רק כן/לא, בלי ערכים)"
for v in AIRTABLE_PAT AIRTABLE_BASE_ID OPENAI_API_KEY TELEGRAM_MANAGER_TOKEN TELEGRAM_CUSTOMER_TOKEN OWNER_CHAT_ID SUPABASE_URL SUPABASE_SERVICE_KEY SUPABASE_DB_URL N8N_API_KEY; do
  val="${!v:-}"
  case "$val" in ""|pat...|app...|sk-...|https://xxxx.supabase.co|*"[ref]"*) s="MISSING";; *) s="set (${#val} chars)";; esac
  printf '%-24s %s\n' "$v" "$s"
done
[ -n "${AIRTABLE_BASE_ID:-}" ] && [[ ! "$AIRTABLE_BASE_ID" =~ ^app[A-Za-z0-9]{14}$ ]] && echo "AIRTABLE_BASE_ID לא בפורמט app + 14 תווים — בדוק שהעתקת רק את החלק שמתחיל ב-app"
echo "--- live checks"
echo "telegram manager:  $(curl -s "https://api.telegram.org/bot$TELEGRAM_MANAGER_TOKEN/getMe" | jq -r '.result.username // "FAIL"')"
echo "telegram customer: $(curl -s "https://api.telegram.org/bot$TELEGRAM_CUSTOMER_TOKEN/getMe" | jq -r '.result.username // "FAIL"')"
echo "owner chat id:     $([ -n "${OWNER_CHAT_ID:-}" ] && echo set || echo MISSING)"
echo "airtable:          $(curl -s -H "Authorization: Bearer $AIRTABLE_PAT" https://api.airtable.com/v0/meta/whoami | jq -r '.id // "FAIL"')"
echo "openai:            $(curl -s -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models | jq -r '.data[0].object // "FAIL"')"
echo "supabase rest:     $(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $SUPABASE_SERVICE_KEY" "$SUPABASE_URL/rest/v1/")"
echo "ngrok domain:      $([ -n "${NGROK_DOMAIN:-}" ] && echo "$NGROK_DOMAIN" || echo MISSING)"
echo "ngrok authtoken:   $([ ${#NGROK_AUTHTOKEN} -gt 20 ] && echo set || echo MISSING)"
echo "n8n keys:          $([ ${#N8N_ENCRYPTION_KEY} -ge 32 ] && [ ${#N8N_WEBHOOK_SECRET} -ge 32 ] && echo ok || echo 'run: openssl rand -hex 16')"
