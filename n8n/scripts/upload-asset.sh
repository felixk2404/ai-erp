#!/usr/bin/env bash
# upload-asset.sh <source-url-or-file> <dest-path e.g. products/TY-HP-200.webp> [airtable-record-id]
# מעלה ל-Supabase Storage (upsert) ומדפיס URL ציבורי; אם ניתן record id — כותב אותו ל-Products.ImageUrl.
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
SRC=$1; DEST=$2; REC=${3:-}
TMP=$(mktemp)
if [[ "$SRC" == http* ]]; then curl -sL "$SRC" -o "$TMP"; else cp "$SRC" "$TMP"; fi
case "$DEST" in *.webp) CT=image/webp;; *.png) CT=image/png;; *) CT=image/jpeg;; esac
code=$(curl -s -o /tmp/sb-up.json -w '%{http_code}' -X POST "$SUPABASE_URL/storage/v1/object/assets/$DEST" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" -H "apikey: $SUPABASE_SERVICE_KEY" -H "Content-Type: $CT" -H "x-upsert: true" --data-binary @"$TMP")
[ "$code" = 200 ] || { echo "upload failed $code: $(cat /tmp/sb-up.json)"; exit 1; }
URL="$SUPABASE_URL/storage/v1/object/public/assets/$DEST"
echo "$URL"
if [ -n "$REC" ]; then
  curl -s -X PATCH "https://api.airtable.com/v0/$AIRTABLE_BASE_ID/Products/$REC" -H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json" \
    -d "{\"fields\":{\"ImageUrl\":\"$URL\"}}" | jq -r '.fields.ImageUrl // .error'
fi
rm -f "$TMP"
