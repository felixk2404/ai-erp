#!/usr/bin/env bash
# משווה את הסכימה בפועל לרשימה הצפויה. נכשל אם שדה חסר, מיותר, או בסוג שגוי.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
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
Invoices.Items:multilineText
Invoices.PdfLockedAt:dateTime
Invoices.Created:createdTime
Leads.Name:singleLineText
Leads.Email:email
Leads.Company:singleLineText
Leads.Status:singleLineText
Leads.Created:createdTime
Leads.Phone:phoneNumber
Leads.Source:singleLineText
Leads.Note:multilineText
Leads.TelegramChatId:singleLineText
Products.Name:singleLineText
Products.Category:singleLineText
Products.Price:number
Products.Description:multilineText
Products.InStock:checkbox
Products.Sku:singleLineText
Products.ImageUrl:url
Products.Stock:number
Products.Highlights:multilineText
Tasks.Title:singleLineText
Tasks.Status:singleLineText
Tasks.Source:singleLineText
Tasks.RefId:singleLineText
Tasks.Created:createdTime
Customers.CustomerId:singleLineText
Customers.Name:singleLineText
Customers.Email:email
Customers.Phone:phoneNumber
Orders.OrderNumber:singleLineText
Orders.CustomerId:singleLineText
Orders.Name:singleLineText
Orders.Email:email
Orders.Phone:phoneNumber
Orders.Address:singleLineText
Orders.City:singleLineText
Orders.Items:multilineText
Orders.Subtotal:number
Orders.Shipping:number
Orders.Vat:number
Orders.Total:number
Orders.Status:singleLineText
Orders.InvoiceNumber:singleLineText
Orders.Note:multilineText
Orders.Created:createdTime
LIST
)
if diff <(echo "$EXPECTED") <(echo "$ACTUAL"); then echo "schema OK"; else echo "schema MISMATCH"; exit 1; fi
