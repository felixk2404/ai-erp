#!/usr/bin/env bash
# rag-count.sh — כמה קטעים יש במאגר הווקטורי, לפי סוג
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
PSQL=$(command -v psql || echo /opt/homebrew/opt/libpq/bin/psql)
"$PSQL" "$SUPABASE_DB_URL" -Atc "select t || ': ' || c from (select coalesce(metadata->>'type','?') t, count(*) c from documents group by 1) x order by 1"
