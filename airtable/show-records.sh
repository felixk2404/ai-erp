#!/usr/bin/env bash
# show-records.sh <Table> [filterByFormula]  — מדפיס רשומות: id ושדות
set -euo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
T=$1; F=${2:-}
curl -s -G -H "Authorization: Bearer $AIRTABLE_PAT" "https://api.airtable.com/v0/$AIRTABLE_BASE_ID/$T" --data-urlencode "filterByFormula=$F" \
  | jq -r '.records[] | [.id] + (.fields | to_entries | map("\(.key)=\(.value|tostring)")) | join("  ")'
