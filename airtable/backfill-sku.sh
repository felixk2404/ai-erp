#!/usr/bin/env bash
# מחלץ "מקט XXX." מתחילת התיאור לשדה Sku ומנקה את התיאור. בטוח להרצה חוזרת (מדלג על מוצרים שכבר יש להם Sku).
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
export AIRTABLE_PAT AIRTABLE_BASE_ID
python3 - <<'PY'
import json, os, re, urllib.request, urllib.parse
pat, base = os.environ["AIRTABLE_PAT"], os.environ["AIRTABLE_BASE_ID"]
H = {"Authorization": f"Bearer {pat}", "Content-Type": "application/json"}
def req(method, path, body=None):
    r = urllib.request.Request(f"https://api.airtable.com/v0/{base}/{path}", method=method, headers=H, data=json.dumps(body).encode() if body else None)
    with urllib.request.urlopen(r) as res: return json.load(res)
rows, offset = [], None
while True:
    q = "Products?" + (f"offset={offset}" if offset else "")
    d = req("GET", q); rows += d["records"]; offset = d.get("offset")
    if not offset: break
updates = []
for r in rows:
    f = r["fields"]
    if f.get("Sku"): continue
    m = re.match(r"^\s*מק\"?ט\s+([A-Za-z0-9\-]+)\.?\s*", f.get("Description", ""))
    if not m: print("no sku:", f.get("Name")); continue
    updates.append({"id": r["id"], "fields": {"Sku": m.group(1), "Description": f["Description"][m.end():].strip()}})
for i in range(0, len(updates), 10):
    req("PATCH", "Products", {"records": updates[i:i+10], "typecast": True})
print(f"updated {len(updates)} products; total {len(rows)}")
PY
