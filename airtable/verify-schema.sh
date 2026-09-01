#!/usr/bin/env bash
# משווה את הסכימה בפועל לרשימה הצפויה. נכשל אם שדה חסר, מיותר, או בסוג שגוי.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && set -a && source .env && set +a
ACTUAL=$(curl -s -H "Authorization: Bearer $AIRTABLE_PAT" \
  "https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables" \
  | jq -r '.tables[] | .name as $t | .fields[] | "\($t).\(.name):\(.type)"' | sort)
EXPECTED=$(sort <<'LIST'
Invoices.InvoiceNumber:singleLineText
Invoices.CustomerId:singleLineText
Invoices.Amount:number
Invoices.VatAmount:number
Invoices.Total:number
Invoices.Status:singleLineText
Invoices.PdfUrl:url
Invoices.Created:createdTime
Leads.Name:singleLineText
Leads.Email:email
Leads.Company:singleLineText
Leads.Status:singleLineText
Leads.Created:createdTime
Products.Name:singleLineText
Products.Category:singleLineText
Products.Price:number
Products.Description:multilineText
Products.InStock:checkbox
Tasks.Title:singleLineText
Tasks.Status:singleLineText
Customers.CustomerId:singleLineText
Customers.Name:singleLineText
Customers.Email:email
Customers.Phone:phoneNumber
LIST
)
if diff <(echo "$EXPECTED") <(echo "$ACTUAL"); then echo "schema OK"; else echo "schema MISMATCH"; exit 1; fi
