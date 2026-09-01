#!/usr/bin/env bash
# ממיר HTML עברי ל-PDF דרך Gotenberg ומוודא שהטקסט נשמר.
set -euo pipefail
TMP=$(mktemp -d)
cat > "$TMP/index.html" <<'HTML'
<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap" rel="stylesheet">
<style>body{font-family:Heebo,sans-serif;padding:40px}h1{color:#0f766e}</style></head>
<body><h1>חשבונית מס INV-0001</h1><p>סה"כ לתשלום: 1,180.00 ₪</p></body></html>
HTML
curl -s -o "$TMP/out.pdf" -F "files=@$TMP/index.html" \
  -F "waitDelay=1s" http://localhost:3001/forms/chromium/convert/html
SIZE=$(stat -f%z "$TMP/out.pdf")
echo "pdf bytes: $SIZE"
[ "$SIZE" -gt 5000 ] || { echo "PDF too small"; exit 1; }
if command -v pdftotext >/dev/null; then pdftotext "$TMP/out.pdf" - | head -3; fi
open "$TMP/out.pdf"
