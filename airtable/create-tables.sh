#!/usr/bin/env bash
# יוצר את חמש הטבלאות דרך Airtable Metadata API. מריצים פעם אחת על בסיס ריק.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && set -a && source .env && set +a
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

create() { # name, fields json array
  printf '%-10s ' "$1"
  curl -s "${H[@]}" -X POST "$API" -d "{\"name\":\"$1\",\"fields\":[$2]}" | jq -r '.id // .error'
}

create Invoices  "$(text InvoiceNumber),$(text CustomerId),$(num Amount),$(num VatAmount),$(num Total),$(text Status),$(url PdfUrl),$(created Created)"
create Leads     "$(text Name),$(email Email),$(text Company),$(text Status),$(created Created)"
create Products  "$(text Name),$(text Category),$(num Price),$(longtext Description),$(checkbox InStock)"
create Tasks     "$(text Title),$(text Status)"
create Customers "$(text CustomerId),$(text Name),$(email Email),$(phone Phone)"

echo
echo "עכשיו: מחקו ידנית את 'Table 1' ב-Airtable UI והריצו airtable/verify-schema.sh"
