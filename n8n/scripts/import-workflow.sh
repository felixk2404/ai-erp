#!/usr/bin/env bash
# import-workflow.sh n8n/workflows/NN-name.json [--activate]
# ממלא placeholders מ-config.json (__KEY__), ממזהי workflows שכבר יובאו (__WF_KEY_ID__),
# מקבצי prompts (__PROMPT_NAME__) ומה-env (__SUPABASE_URL__); יוצר או מעדכן לפי שם; שומר id ב-config.json.
set -euo pipefail
TPL=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
ACTIVATE=${2:-}
cd "$(dirname "$0")/.." && source scripts/load-env.sh
API=./scripts/n8n-api.sh

JQ_ARGS=(--rawfile tpl "$TPL" --slurpfile cfg config.json --arg supa "$SUPABASE_URL")
FILTER='$tpl'
for k in $(jq -r 'to_entries[] | select(.value|type=="string") | .key' config.json); do
  FILTER="$FILTER | gsub(\"__${k}__\"; \$cfg[0][\"$k\"])"
done
for k in $(jq -r '.workflows | keys[]' config.json); do
  FILTER="$FILTER | gsub(\"__WF_${k}_ID__\"; \$cfg[0].workflows[\"$k\"])"
done
for p in prompts/*.md; do
  name=$(basename "$p" .md | tr 'a-z-' 'A-Z_')
  JQ_ARGS+=(--rawfile "p_$name" "$p")
  FILTER="$FILTER | gsub(\"__PROMPT_${name}__\"; (\$p_$name | rtrimstr(\"\\n\") | tojson | .[1:-1]))"
done
FILTER="$FILTER | gsub(\"__SUPABASE_URL__\"; \$supa)"

BODY=$(jq -n "${JQ_ARGS[@]}" "$FILTER | fromjson
  | .nodes |= (to_entries | map(.value.id = (.value.id // (\"00000000-0000-4000-8000-\" + ((\"000000000000\" + (.key|tostring))[-12:]))) | .value))
  | {name, nodes, connections, settings: (.settings // {executionOrder: \"v1\"})}")
NAME=$(echo "$BODY" | jq -r .name)
if echo "$BODY" | grep -qE '__[A-Z][A-Z0-9_]*__'; then
  echo "placeholder לא מולא ב-$NAME:"; echo "$BODY" | grep -oE '__[A-Z][A-Z0-9_]*__' | sort -u; exit 1
fi

ID=$($API GET "/workflows?limit=250" | jq -r --arg n "$NAME" '.data[] | select(.name==$n) | .id' | head -1)
if [ -n "$ID" ]; then
  RES=$($API PUT "/workflows/$ID" "$BODY")
else
  RES=$($API POST "/workflows" "$BODY")
  ID=$(echo "$RES" | jq -r '.id // empty')
fi
if [ -z "$ID" ] || [ "$ID" = "null" ]; then echo "import failed:"; echo "$RES" | jq -c '{message, description}' 2>/dev/null || echo "$RES" | head -c 600; exit 1; fi
if echo "$RES" | jq -e '.message' >/dev/null 2>&1 && ! echo "$RES" | jq -e '.id' >/dev/null 2>&1; then echo "update failed:"; echo "$RES" | jq -c '{message, description}'; exit 1; fi

KEY=$(basename "$TPL" .json | sed -E 's/^[0-9a-z]+-//' | tr 'a-z-' 'A-Z_')
jq --arg k "$KEY" --arg id "$ID" '.workflows[$k] = $id' config.json > config.json.tmp && mv config.json.tmp config.json

ACTIVE=$(echo "$RES" | jq -r '.active // false')
if [ "$ACTIVATE" = "--activate" ]; then
  ACTIVE=$($API POST "/workflows/$ID/activate" | jq -r 'if .active != null then .active else ("ERR: " + (.message // "")) end')
fi
echo "$NAME  id=$ID  active=$ACTIVE"
