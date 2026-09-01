#!/usr/bin/env bash
# מריץ את supabase.sql ומאמת. דורש: brew install libpq
set -euo pipefail
cd "$(dirname "$0")/.." && set -a && source .env && set +a
PSQL=$(command -v psql || echo /opt/homebrew/opt/libpq/bin/psql)
"$PSQL" "$SUPABASE_DB_URL" -f supabase.sql
echo "--- verify"
"$PSQL" "$SUPABASE_DB_URL" -Atc "select 'documents rows: ' || count(*) from documents; select 'function: ' || proname from pg_proc where proname='match_documents';"
