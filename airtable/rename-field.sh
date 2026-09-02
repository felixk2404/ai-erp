#!/usr/bin/env bash
# rename-field.sh <Table> <OldName> <NewName>  — משנה שם שדה דרך ה-Metadata API. לא נוגע בנתונים.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
TABLE=$1; OLD=$2; NEW=$3
API="https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables"
H=(-H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json")
SCHEMA=$(curl -s "${H[@]}" "$API")
TBL=$(echo "$SCHEMA" | jq -r --arg t "$TABLE" '.tables[] | select(.name==$t) | .id')
FLD=$(echo "$SCHEMA" | jq -r --arg t "$TABLE" --arg n "$OLD" '.tables[] | select(.name==$t) | .fields[] | select(.name==$n) | .id')
[ -z "$TBL" ] && { echo "table $TABLE not found"; exit 1; }
[ -z "$FLD" ] && { echo "field $TABLE.$OLD not found"; exit 1; }
curl -s "${H[@]}" -X PATCH "$API/$TBL/fields/$FLD" -d "$(jq -nc --arg n "$NEW" '{name:$n}')" | jq -r '"\(.name // .error) (\(.type // ""))"'
