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
add Products Stock '{"name":"Stock","type":"number","options":{"precision":0},"description":"כמות במלאי. ריק לשירותים."}'
add Products Highlights '{"name":"Highlights","type":"multilineText","description":"3 נקודות מפרט, שורה לכל נקודה"}'
add Tasks Source '{"name":"Source","type":"singleLineText","description":"order / stock / lead / invoice / manual"}'
add Tasks RefId '{"name":"RefId","type":"singleLineText","description":"ORD-0003 / מק\"ט / INV-0007 / record id של ליד"}'
add Leads Phone '{"name":"Phone","type":"phoneNumber"}'
add Leads Source '{"name":"Source","type":"singleLineText","description":"manual / telegram"}'
add Leads Note '{"name":"Note","type":"multilineText","description":"למשל: מתעניין ב{מוצר} ({SKU})"}'
add Leads TelegramChatId '{"name":"TelegramChatId","type":"singleLineText","description":"chat.id של הלקוח בטלגרם"}'
