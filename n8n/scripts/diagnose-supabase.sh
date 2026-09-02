#!/usr/bin/env bash
# מאבחן חיבור ל-Supabase: URL (לא סוד), סטטוס REST, סוג המפתח, חיבור DB.
set -uo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
echo "SUPABASE_URL: $SUPABASE_URL"
case "$SUPABASE_SERVICE_KEY" in eyJ*) echo "key type: JWT (legacy service_role)";; sb_secret_*) echo "key type: new secret key";; *) echo "key type: unknown prefix";; esac
echo "REST /rest/v1/ : $(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $SUPABASE_SERVICE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" "${SUPABASE_URL%/}/rest/v1/")"
echo "auth /auth/v1/health : $(curl -s -o /dev/null -w '%{http_code}' -H "apikey: $SUPABASE_SERVICE_KEY" "${SUPABASE_URL%/}/auth/v1/health")"
u="${SUPABASE_DB_URL:-}"
echo "DB URL: length ${#u}, starts '${u:0:13}', ends '${u: -22}'$([[ "$u" == *"[YOUR-PASSWORD]"* ]] && echo ', עדיין מכיל [YOUR-PASSWORD]')$([[ "$u" == *"’"* || "$u" == *"‘"* ]] && echo ', מכיל גרשיים חכמים ’ — צריך גרש ישר')"
if [ -n "${SUPABASE_DB_URL:-}" ] && [[ "$SUPABASE_DB_URL" != *"[ref]"* ]]; then
  PSQL=$(command -v psql || echo /opt/homebrew/opt/libpq/bin/psql)
  pw="${u#*://}"; pw="${pw#*:}"; pw="${pw%%@*}"
  host="${u##*@}"; host="${host%%:*}"; user="${u#*://}"; user="${user%%:*}"
  echo "DB user: $user  host: $host  password length: ${#pw}"
  echo "DB: $("$PSQL" "$SUPABASE_DB_URL" -Atc 'select version()' 2>&1 | head -1 | sed "s|$pw|***|g" | cut -c1-120)"
else
  echo "DB: SUPABASE_DB_URL MISSING"
fi
