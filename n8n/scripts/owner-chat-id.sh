#!/usr/bin/env bash
# מדפיס את chat id של מי ששלח לאחרונה הודעה לבוט המנהל. להעתיק ל-OWNER_CHAT_ID.
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
curl -s "https://api.telegram.org/bot$TELEGRAM_MANAGER_TOKEN/getUpdates" | jq -r '.result[-1].message.chat.id // "null — שלח הודעה לבוט ונסה שוב"'
