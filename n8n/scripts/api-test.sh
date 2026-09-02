#!/usr/bin/env bash
# api-test.sh '<json body>'  — קורא ל-WF13 (webhook /erp) עם ה-secret מה-.env
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
curl -s -w '\nHTTP %{http_code}\n' -X POST "https://$NGROK_DOMAIN/webhook/erp" \
  -H "Content-Type: application/json" -H "x-erp-secret: $N8N_WEBHOOK_SECRET" -d "$1"
