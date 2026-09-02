#!/usr/bin/env bash
# executions.sh "<workflow name>" [n]  — n ההרצות האחרונות: סטטוס, זמן, צומת אחרון, שגיאה
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
NAME=$1; N=${2:-5}
ID=$(./scripts/n8n-api.sh GET "/workflows?limit=250" | jq -r --arg n "$NAME" '.data[] | select(.name==$n) | .id')
[ -z "$ID" ] && { echo "workflow לא נמצא: $NAME"; exit 1; }
./scripts/n8n-api.sh GET "/executions?workflowId=$ID&limit=$N&includeData=true" \
  | jq -r '.data[] | "\(.status)\t\(.startedAt)\t\(.data.resultData.lastNodeExecuted // "-")\t\(.data.resultData.error.message // "")"'
