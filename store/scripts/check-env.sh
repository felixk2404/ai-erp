#!/usr/bin/env bash
# בודק שכל משתני הסביבה של החנות מוגדרים ב-store/.env.local. מדפיס רק set/MISSING, לעולם לא ערכים.
set -euo pipefail
cd "$(dirname "$0")/.."
FILE=".env.local"
[ -f "$FILE" ] || { echo "MISSING file: store/$FILE"; exit 1; }
for k in AIRTABLE_PAT AIRTABLE_BASE_ID N8N_WEBHOOK_URL N8N_WEBHOOK_SECRET NEXT_PUBLIC_SITE_URL; do
  v=$(grep -E "^${k}=" "$FILE" | head -1 | cut -d= -f2- | tr -d '"'"'"' \r' | sed 's/[[:space:]]*$//')
  if [ -n "$v" ]; then echo "$k: set (${#v} chars)"; else echo "$k: MISSING"; fi
done
