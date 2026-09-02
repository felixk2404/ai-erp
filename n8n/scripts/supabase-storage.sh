#!/usr/bin/env bash
# יוצר bucket ציבורי 'assets' ב-Supabase Storage (בטוח להרצה חוזרת) ומדפיס את בסיס ה-URL הציבורי.
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
H=(-H "Authorization: Bearer $SUPABASE_SERVICE_KEY" -H "apikey: $SUPABASE_SERVICE_KEY" -H "Content-Type: application/json")
code=$(curl -s -o /tmp/sb-bucket.json -w '%{http_code}' "${H[@]}" -X POST "$SUPABASE_URL/storage/v1/bucket" -d '{"id":"assets","name":"assets","public":true,"file_size_limit":10485760,"allowed_mime_types":["image/webp","image/png","image/jpeg"]}')
case "$code" in 200|201) echo "bucket created";; 400|409) grep -q "already exists" /tmp/sb-bucket.json && echo "bucket exists" || { cat /tmp/sb-bucket.json; exit 1; };; *) cat /tmp/sb-bucket.json; exit 1;; esac
echo "public base: $SUPABASE_URL/storage/v1/object/public/assets"
