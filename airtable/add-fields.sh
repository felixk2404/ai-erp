#!/usr/bin/env bash
# מוסיף ל-Products את השדות Sku (טקסט) ו-ImageUrl (url). בטוח להרצה חוזרת.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
API="https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables"
H=(-H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json")
SCHEMA=$(curl -s "${H[@]}" "$API")
TBL=$(echo "$SCHEMA" | jq -r '.tables[] | select(.name=="Products") | .id')
add() { # name json
  if echo "$SCHEMA" | jq -e --arg n "$1" '.tables[] | select(.name=="Products") | .fields[] | select(.name==$n)' >/dev/null; then echo "$1 exists"; return; fi
  printf '%-10s ' "$1"; curl -s "${H[@]}" -X POST "$API/$TBL/fields" -d "$2" | jq -r '.id // .error'
}
add Sku '{"name":"Sku","type":"singleLineText"}'
add ImageUrl '{"name":"ImageUrl","type":"url"}'
