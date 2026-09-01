#!/usr/bin/env bash
# רשומות ראשונות לבדיקה: לקוח אחד ושני מוצרים.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && set -a && source .env && set +a
H=(-H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json")
BASE="https://api.airtable.com/v0/$AIRTABLE_BASE_ID"

curl -s "${H[@]}" -X POST "$BASE/Customers" -d '{"records":[
  {"fields":{"CustomerId":"CUST-0001","Name":"דוד לוי","Email":"david@example.com","Phone":"050-1234567"}}
]}' | jq -r '.records[].id // .error'

curl -s "${H[@]}" -X POST "$BASE/Products" -d '{"records":[
  {"fields":{"Name":"אוזניות אלחוטיות SoundMax Pro","Category":"אודיו","Price":349.9,"Description":"אוזניות Bluetooth 5.3 עם ביטול רעשים אקטיבי, 30 שעות סוללה, עמידות למים IPX4. אחריות שנה.","InStock":true}},
  {"fields":{"Name":"מטען USB-C 65W","Category":"מטענים","Price":129,"Description":"מטען GaN קומפקטי, שתי יציאות USB-C ואחת USB-A, טעינה מהירה למחשבים ניידים וטלפונים.","InStock":true}}
]}' | jq -r '.records[].id // .error'
