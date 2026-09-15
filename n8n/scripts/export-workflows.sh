#!/usr/bin/env bash
# export-workflows.sh — מושך snapshot תקין לפני שמחליף קובצי גיבוי קיימים.
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
mkdir -p workflows/exported
STAGING=$(mktemp -d)
trap 'rm -rf "$STAGING"' EXIT
mkdir "$STAGING/items"
./scripts/n8n-api.sh GET "/workflows?limit=250" \
  | jq -e 'if (.data | type) == "array" and (.nextCursor == null) then .data else error("incomplete workflow list") end' > "$STAGING/list.json"
jq -c '.[]' "$STAGING/list.json" | while read -r wf; do
  id=$(echo "$wf" | jq -er '.id'); name=$(echo "$wf" | jq -er '.name' | tr ' /' '__')
  ./scripts/n8n-api.sh GET "/workflows/$id" \
    | jq -e --arg id "$id" 'if .id == $id and (.nodes|type) == "array" and (.connections|type) == "object" and (.name|type) == "string" and (.active|type) == "boolean" then {name, nodes, connections, settings, active} else error("invalid workflow response") end' > "$STAGING/items/$name.json"
done
# מגיעים לכאן רק אם כל הקריאות והאימותים הצליחו. אין דריסה חלקית בכשל API.
jq -r '.[].name' "$STAGING/list.json" | tr ' /' '__' | while IFS= read -r name; do
  mv "$STAGING/items/$name.json" "workflows/exported/$name.json"
  echo "exported $name"
done
