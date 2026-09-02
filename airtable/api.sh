#!/usr/bin/env bash
# api.sh METHOD /Table[/recId][?query] [json-body]  — קריאה גולמית ל-Airtable API על הבסיס מה-.env
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
METHOD=$1; P=$2; BODY=${3:-}
ARGS=(-s -X "$METHOD" -H "Authorization: Bearer $AIRTABLE_PAT" -H "Content-Type: application/json" "https://api.airtable.com/v0/$AIRTABLE_BASE_ID$P")
[ -n "$BODY" ] && ARGS+=(-d "$BODY")
curl "${ARGS[@]}"
