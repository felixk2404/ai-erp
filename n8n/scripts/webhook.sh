#!/usr/bin/env bash
# webhook.sh <path> ['<json body>']  — POST ל-webhook של n8n עם ה-secret (למשל reindex-policies, reindex-products, erp)
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
BODY=${2:-'{}'}
curl -s -m 600 -w '\nHTTP %{http_code}\n' -X POST "https://$NGROK_DOMAIN/webhook/$1" \
  -H "Content-Type: application/json" -H "x-erp-secret: $N8N_WEBHOOK_SECRET" -d "$BODY"
