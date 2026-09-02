#!/usr/bin/env bash
# n8n-api.sh METHOD /path [json-body]   — קורא ל-n8n Public API עם המפתח מה-.env
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
METHOD=$1; P=$2; BODY=${3:-}
ARGS=(-s -X "$METHOD" -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json" "http://localhost:5678/api/v1$P")
[ -n "$BODY" ] && ARGS+=(-d "$BODY")
curl "${ARGS[@]}"
