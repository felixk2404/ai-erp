#!/usr/bin/env bash
# export-workflows.sh — מושך את כל ה-workflows ל-n8n/workflows/exported/<name>.json (מקור האמת להגשה)
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
mkdir -p workflows/exported
./scripts/n8n-api.sh GET "/workflows?limit=250" | jq -c '.data[]' | while read -r wf; do
  id=$(echo "$wf" | jq -r .id); name=$(echo "$wf" | jq -r .name | tr ' /' '__')
  ./scripts/n8n-api.sh GET "/workflows/$id" | jq '{name, nodes, connections, settings, active}' > "workflows/exported/$name.json"
  echo "exported $name"
done
