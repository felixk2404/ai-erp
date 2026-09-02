#!/usr/bin/env bash
# מלאי התחלתי דטרמיניסטי + 3 נקודות מפרט לכל מוצר. בטוח להרצה חוזרת (מדלג על מוצרים שכבר יש להם Stock).
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
export AIRTABLE_PAT AIRTABLE_BASE_ID
python3 - <<'PY'
import json, os, re, urllib.request, urllib.parse, hashlib
pat, base = os.environ["AIRTABLE_PAT"], os.environ["AIRTABLE_BASE_ID"]
H = {"Authorization": f"Bearer {pat}", "Content-Type": "application/json"}
def get(path):
    with urllib.request.urlopen(urllib.request.Request(f"https://api.airtable.com/v0/{base}/{path}", headers=H)) as r: return json.load(r)
def patch(table, records):
    req = urllib.request.Request(f"https://api.airtable.com/v0/{base}/{table}", data=json.dumps({"records": records, "typecast": True}).encode(), headers=H, method="PATCH")
    with urllib.request.urlopen(req) as r: return len(json.load(r)["records"])
recs, offset = [], ""
while True:
    page = get("Products?pageSize=100" + (f"&offset={offset}" if offset else ""))
    recs += page["records"]; offset = page.get("offset", "")
    if not offset: break
SERVICE = "שירותים"
def highlights(desc):
    m = re.search(r"מפרט:\s*(.*)", desc or "")
    parts = [p.strip(" .") for p in re.split(r"[;؛]", m.group(1) if m else (desc or "")) if p.strip()]
    return "\n".join(parts[:3])
updates, zeros = [], 0
for r in sorted(recs, key=lambda r: r["fields"].get("Sku", "")):
    f = r["fields"]; sku = f.get("Sku", r["id"]); fields = {}
    if not f.get("Highlights"): fields["Highlights"] = highlights(f.get("Description", ""))
    if f.get("Category") != SERVICE and f.get("Stock") is None:
        stock = 0 if not f.get("InStock") else 1 + int(hashlib.md5(sku.encode()).hexdigest(), 16) % 40
        if stock == 0: zeros += 1
        fields["Stock"] = stock; fields["InStock"] = stock > 0
    if fields: updates.append({"id": r["id"], "fields": fields})
# לפחות שני מוצרים ב-0 להדגמת "נגמר במלאי"
physical = [u for u in updates if "Stock" in u["fields"]]
for u in physical:
    if zeros >= 2: break
    if u["fields"]["Stock"] > 0: u["fields"]["Stock"] = 0; u["fields"]["InStock"] = False; zeros += 1
n = sum(patch("Products", updates[i:i+10]) for i in range(0, len(updates), 10))
print(f"updated {n} products, out-of-stock: {zeros}")
PY
