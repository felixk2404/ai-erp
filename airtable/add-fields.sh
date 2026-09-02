#!/usr/bin/env bash
# מוסיף שדות חסרים: Products.Sku, Products.ImageUrl, Invoices.Items. בטוח להרצה חוזרת.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
API="https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables"
H=(-H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json")
SCHEMA=$(curl -s "${H[@]}" "$API")
add() { # table name json
  local tbl; tbl=$(echo "$SCHEMA" | jq -r --arg t "$1" '.tables[] | select(.name==$t) | .id')
  if echo "$SCHEMA" | jq -e --arg t "$1" --arg n "$2" '.tables[] | select(.name==$t) | .fields[] | select(.name==$n)' >/dev/null; then echo "$1.$2 exists"; return; fi
  printf '%-18s ' "$1.$2"; curl -s "${H[@]}" -X POST "$API/$tbl/fields" -d "$3" | jq -r '.id // .error'
}
add Products Sku '{"name":"Sku","type":"singleLineText"}'
add Products ImageUrl '{"name":"ImageUrl","type":"url"}'
add Invoices Items '{"name":"Items","type":"multilineText","description":"JSON: [{sku,name,qty,price}]"}'
