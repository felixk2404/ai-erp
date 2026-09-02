#!/usr/bin/env bash
# מאבחן הרשאות של ה-PAT: לאילו בסיסים יש גישה, והאם יש scope לסכימה.
set -uo pipefail
cd "$(dirname "$0")/../n8n" && source scripts/load-env.sh
H=(-H "Authorization: Bearer $AIRTABLE_PAT")
echo "מזהה הטוקן (החלק הציבורי לפני הנקודה): ${AIRTABLE_PAT%%.*}"
echo "scopes של הטוקן:"
curl -s "${H[@]}" https://api.airtable.com/v0/meta/whoami | jq -r '"  " + ((.scopes // ["(none)"]) | join(", "))'
echo "בסיסים שהטוקן רואה:"
curl -s "${H[@]}" https://api.airtable.com/v0/meta/bases | jq -r 'if .bases then (.bases[] | "  \(.id)  \(.name)  (\(.permissionLevel))") else "  \(.error.type // .error)" end'
echo "הבסיס שב-.env: $AIRTABLE_BASE_ID"
echo "קריאת סכימה (schema.bases:read):"
curl -s "${H[@]}" "https://api.airtable.com/v0/meta/bases/$AIRTABLE_BASE_ID/tables" | jq -r 'if .tables then "  OK: \(.tables|length) tables: \([.tables[].name]|join(", "))" else "  \(.error.type)" end'
