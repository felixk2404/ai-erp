#!/usr/bin/env bash
# מרים טאנל ngrok לכתובת הקבועה. להשאיר רץ בטרמינל נפרד.
set -euo pipefail
cd "$(dirname "$0")/.." && set -a && source .env && set +a
exec ngrok http 5678 --domain="$NGROK_DOMAIN"
