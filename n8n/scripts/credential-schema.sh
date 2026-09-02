#!/usr/bin/env bash
# מדפיס את שדות ה-credential לפי סוג, למקרה שהסכימה של n8n השתנתה.
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
for t in "${@:-airtableTokenApi openAiApi telegramApi supabaseApi httpHeaderAuth}"; do
  for x in $t; do
    echo "== $x"
    curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" "http://localhost:5678/api/v1/credentials/schema/$x" | jq -c '.properties | keys'
  done
done
