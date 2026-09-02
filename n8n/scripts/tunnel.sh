#!/usr/bin/env bash
# מרים טאנל ngrok לכתובת הקבועה. להשאיר רץ בטרמינל נפרד.
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
ngrok config add-authtoken "$NGROK_AUTHTOKEN" >/dev/null
exec ngrok http 5678 --domain="$NGROK_DOMAIN" --log=stdout --log-format=term
