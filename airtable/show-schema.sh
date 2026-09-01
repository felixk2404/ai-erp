#!/usr/bin/env bash
# מדפיס את הסכימה בפועל: טבלה, שדה, סוג. אופציונלי: שם טבלה לסינון.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && set -a && source .env && set +a
curl -s -H "Authorization: Bearer $AIRTABLE_PAT" \
  "https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables" \
  | jq -r --arg t "${1:-}" '.tables[] | select($t=="" or .name==$t) | "\(.name)" as $n | .fields[] | "  \($n).\(.name): \(.type)"'
