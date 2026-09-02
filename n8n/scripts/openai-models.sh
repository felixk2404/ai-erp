#!/usr/bin/env bash
# מדפיס מודלי OpenAI זמינים למפתח (שמות בלבד), לבחירת מודל זול לסוכנים.
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
curl -s -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models \
  | jq -r '.data[].id' | grep -E "^(gpt-5|gpt-4\.1|gpt-4o|o4|text-embedding)" | sort
