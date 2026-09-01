#!/usr/bin/env bash
# יוצר את ה-credentials הלא-OAuth ב-n8n דרך Public API. Google OAuth נעשה ב-UI.
# דורש N8N_API_KEY ב-.env (Settings -> n8n API ב-n8n).
set -euo pipefail
cd "$(dirname "$0")/.." && set -a && source .env && set +a
API="http://localhost:5678/api/v1/credentials"
H=(-H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json")

mk() { # name type data-json
  printf '%-22s ' "$1"
  curl -s "${H[@]}" -X POST "$API" -d "{\"name\":\"$1\",\"type\":\"$2\",\"data\":$3}" | jq -r '.id // .message'
}

mk "Airtable ERP"       airtableTokenApi  "{\"accessToken\":\"$AIRTABLE_PAT\"}"
mk "OpenAI ERP"         openAiApi         "{\"apiKey\":\"$OPENAI_API_KEY\"}"
mk "Telegram Manager"   telegramApi       "{\"accessToken\":\"$TELEGRAM_MANAGER_TOKEN\"}"
mk "Telegram Customer"  telegramApi       "{\"accessToken\":\"$TELEGRAM_CUSTOMER_TOKEN\"}"
mk "Supabase ERP"       supabaseApi       "{\"host\":\"$SUPABASE_URL\",\"serviceRole\":\"$SUPABASE_SERVICE_KEY\"}"
mk "ERP Webhook Secret" httpHeaderAuth    "{\"name\":\"x-erp-secret\",\"value\":\"$N8N_WEBHOOK_SECRET\"}"

echo
echo "אם מופיעה שגיאת סכימה, בדקו שמות שדות: n8n/scripts/credential-schema.sh <type>"
