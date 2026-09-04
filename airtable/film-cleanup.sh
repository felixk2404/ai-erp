#!/usr/bin/env bash
# ניקוי נתוני דמו לפני צילום סרט התדמית: שם אמיתי ללקוח הבדיקה, מחיקת הזמנת ה-e2e והחשבונית שלה.
# בטוח להרצה חוזרת. מדפיס מה עשה.
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
export AIRTABLE_PAT AIRTABLE_BASE_ID
python3 - <<'PY'
import json, os, urllib.request, urllib.parse
pat, base = os.environ["AIRTABLE_PAT"], os.environ["AIRTABLE_BASE_ID"]
H = {"Authorization": f"Bearer {pat}", "Content-Type": "application/json"}
def api(method, path, body=None):
    req = urllib.request.Request(f"https://api.airtable.com/v0/{base}/{path}", data=json.dumps(body).encode() if body else None, headers=H, method=method)
    with urllib.request.urlopen(req) as r: return json.load(r)
def find(table, formula):
    return api("GET", f"{table}?filterByFormula={urllib.parse.quote(formula)}")["records"]

# 1. לקוח הבדיקה -> שם אמיתי
for r in find("Customers", "{CustomerId}='CUST-0002'"):
    if r["fields"].get("Name") != "יוסי לוי":
        api("PATCH", "Customers", {"records": [{"id": r["id"], "fields": {"Name": "יוסי לוי"}}]})
        print("renamed CUST-0002:", r["fields"].get("Name"), "-> יוסי לוי")
    else:
        print("CUST-0002 already יוסי לוי")

# 2. הזמנות בדיקה (שם לקוח שמכיל 'בדיקה') + החשבוניות שלהן
test_orders = find("Orders", "FIND('בדיקה', {Name})")
for o in test_orders:
    inv = o["fields"].get("InvoiceNumber")
    if inv:
        for i in find("Invoices", f"{{InvoiceNumber}}='{inv}'"):
            api("DELETE", f"Invoices/{i['id']}"); print("deleted invoice", inv)
    api("DELETE", f"Orders/{o['id']}"); print("deleted order", o["fields"].get("OrderNumber"), o["fields"].get("Name"))
if not test_orders: print("no test orders left")

# 3. משימות יתומות של ההזמנות שנמחקו
for o in test_orders:
    for t in find("Tasks", f"{{RefId}}='{o['fields'].get('OrderNumber','')}'"):
        api("DELETE", f"Tasks/{t['id']}"); print("deleted task", t["fields"].get("Title"))

# 4. הזמנות ישנות שנושאות את השם האמיתי של פליקס -> השם הדמו (Name בהזמנה הוא עותק, לא lookup)
for o in find("Orders", "{Name}='פליקס קריינוביץ'"):
    api("PATCH", "Orders", {"records": [{"id": o["id"], "fields": {"Name": "יוסי לוי"}}]}); print("renamed order", o["fields"].get("OrderNumber"))
for i in find("Invoices", "{CustomerId}='CUST-0002'"):
    pass  # invoices reference CustomerId only; nothing to patch

# 5. תמונת מצב: שמות לקוחות + הזמנות אחרונות
print("customers:", [r["fields"].get("Name") for r in api("GET", "Customers?pageSize=50")["records"]])
print("orders:", [(r["fields"].get("OrderNumber"), r["fields"].get("Name"), r["fields"].get("Status")) for r in api("GET", "Orders?pageSize=50&sort%5B0%5D%5Bfield%5D=OrderNumber")["records"]])
PY
