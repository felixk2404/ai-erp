#!/usr/bin/env bash
# יוצר את חמש הטבלאות דרך Airtable Metadata API. בטוח להרצה חוזרת: מדלג על טבלאות ושדות שקיימים.
# createdTime לא נתמך ביצירת טבלה, לכן Created מתווסף כשדה נפרד אחרי.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
API="https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables"
H=(-H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json")

text()     { printf '{"name":"%s","type":"singleLineText"}' "$1"; }
longtext() { printf '{"name":"%s","type":"multilineText"}' "$1"; }
num()      { printf '{"name":"%s","type":"number","options":{"precision":2}}' "$1"; }
email()    { printf '{"name":"%s","type":"email"}' "$1"; }
phone()    { printf '{"name":"%s","type":"phoneNumber"}' "$1"; }
url()      { printf '{"name":"%s","type":"url"}' "$1"; }
created()  { printf '{"name":"%s","type":"createdTime","options":{"result":{"type":"dateTime","options":{"dateFormat":{"name":"iso"},"timeFormat":{"name":"24hour"},"timeZone":"Asia/Jerusalem"}}}}' "$1"; }
checkbox() { printf '{"name":"%s","type":"checkbox","options":{"icon":"check","color":"greenBright"}}' "$1"; }

SCHEMA=$(curl -s "${H[@]}" "$API")
table_id() { echo "$SCHEMA" | jq -r --arg n "$1" '.tables[] | select(.name==$n) | .id'; }
has_field() { echo "$SCHEMA" | jq -e --arg t "$1" --arg f "$2" '.tables[] | select(.name==$t) | .fields[] | select(.name==$f)' >/dev/null; }

create() { # name, fields json array
  printf '%-10s ' "$1"
  local id; id=$(table_id "$1")
  if [ -n "$id" ]; then echo "exists ($id)"; return; fi
  curl -s "${H[@]}" -X POST "$API" -d "{\"name\":\"$1\",\"fields\":[$2]}" | jq -r '.id // .error'
  SCHEMA=$(curl -s "${H[@]}" "$API")
}

addfield() { # table, field json
  local t=$1 f=$2 name; name=$(echo "$f" | jq -r .name)
  printf '%-10s + %-8s ' "$t" "$name"
  if has_field "$t" "$name"; then echo "exists"; return; fi
  curl -s "${H[@]}" -X POST "$API/$(table_id "$t")/fields" -d "$f" | jq -r '.id // .error'
}

create Invoices  "$(text InvoiceNumber),$(text CustomerId),$(num Amount),$(num VatAmount),$(num Total),$(text Status),$(url PdfUrl)"
create Leads     "$(text Name),$(email Email),$(text Company),$(text Status)"
create Products  "$(text Name),$(text Category),$(num Price),$(longtext Description),$(checkbox InStock)"
create Tasks     "$(text Title),$(text Status)"
create Customers "$(text CustomerId),$(text Name),$(email Email),$(phone Phone)"
create Orders    "$(text OrderNumber),$(text CustomerId),$(text Name),$(email Email),$(phone Phone),$(text Address),$(text City),$(longtext Items),$(num Subtotal),$(num Shipping),$(num Vat),$(num Total),$(text Status),$(text InvoiceNumber),$(longtext Note)"
# Metadata API אינו תומך ביצירת createdTime (UNSUPPORTED_FIELD_TYPE_FOR_CREATE), גם לא כשדה נפרד.
# אבל שינוי שם כן נתמך: אם נוצר ידנית בשם אחר (created / Created Time), מתקנים ל-Created.
for t in Invoices Leads Orders; do
  if has_field "$t" Created; then echo "$t.Created exists"; continue; fi
  fid=$(echo "$SCHEMA" | jq -r --arg t "$t" '.tables[] | select(.name==$t) | .fields[] | select(.type=="createdTime") | .id' | head -1)
  if [ -n "$fid" ]; then
    printf '%-10s rename createdTime field -> Created: ' "$t"
    curl -s "${H[@]}" -X PATCH "$API/$(table_id "$t")/fields/$fid" -d '{"name":"Created"}' | jq -r '.name // .error'
  else
    echo "ידני: ב-$t הוסיפו שדה 'Created' מסוג Created time (Airtable UI: + → Created time)"
  fi
done

echo
echo "ידני: מחקו את 'Table 1' ב-Airtable UI. אחר כך: airtable/verify-schema.sh"
