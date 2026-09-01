#!/usr/bin/env bash
# טוען ל-Airtable: לקוח בדיקה אחד + 34 המוצרים מ-docs/course/products/products.csv (בקבוצות של 10).
set -euo pipefail
cd "$(dirname "$0")/../n8n" && set -a && source .env && set +a
export AIRTABLE_PAT AIRTABLE_BASE_ID
python3 - <<'PY'
import csv, json, os, urllib.request

pat, base = os.environ["AIRTABLE_PAT"], os.environ["AIRTABLE_BASE_ID"]

def post(table, records):
    req = urllib.request.Request(
        f"https://api.airtable.com/v0/{base}/{table}",
        data=json.dumps({"records": records}).encode(),
        headers={"Authorization": f"Bearer {pat}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return len(json.load(r)["records"])

n = post("Customers", [{"fields": {"CustomerId": "CUST-0001", "Name": "דוד לוי",
                                    "Email": "david@example.com", "Phone": "050-1234567"}}])
print(f"Customers: {n}")

rows = list(csv.DictReader(open("../docs/course/products/products.csv", encoding="utf-8")))
recs = [{"fields": {"Name": r["Name"], "Category": r["Category"], "Price": float(r["Price"]),
                    "Description": r["Description"], "InStock": r["InStock"].strip() == "checked"}} for r in rows]
total = sum(post("Products", recs[i:i + 10]) for i in range(0, len(recs), 10))
print(f"Products: {total}")
PY
