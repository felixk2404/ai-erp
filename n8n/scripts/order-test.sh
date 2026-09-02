#!/usr/bin/env bash
# order-test.sh [happy|service|oos|bad|status ORD-0001 email]  — בדיקות ל-WF13 order / order_status
set -euo pipefail
cd "$(dirname "$0")/.." && source scripts/load-env.sh
call() { curl -s -m 120 -X POST "https://$NGROK_DOMAIN/webhook/erp" -H "Content-Type: application/json" -H "x-erp-secret: $N8N_WEBHOOK_SECRET" -d "$1"; echo; }
EMAIL=${TEST_EMAIL:-felixk2404@gmail.com}
case "${1:-happy}" in
  happy)  call "{\"action\":\"order\",\"order\":{\"customer\":{\"name\":\"בדיקה חנות\",\"email\":\"$EMAIL\",\"phone\":\"050-0000000\",\"address\":\"הרצל 1\",\"city\":\"תל אביב\"},\"items\":[{\"sku\":\"TY-HP-200\",\"qty\":1},{\"sku\":\"TY-CB-UC100\",\"qty\":2}],\"note\":\"הזמנת בדיקה\"}}" ;;
  service) call "{\"action\":\"order\",\"order\":{\"customer\":{\"name\":\"בדיקה שירות\",\"email\":\"$EMAIL\",\"phone\":\"050-0000000\"},\"items\":[{\"sku\":\"TY-SRV-01\",\"qty\":1}]}}" ;;
  oos)    call "{\"action\":\"order\",\"order\":{\"customer\":{\"name\":\"בדיקה מלאי\",\"email\":\"$EMAIL\",\"phone\":\"050-0000000\",\"address\":\"הרצל 1\",\"city\":\"תל אביב\"},\"items\":[{\"sku\":\"TY-HP-200\",\"qty\":99}]}}" ;;
  bad)    call '{"action":"order","order":{"customer":{"name":"x","email":"nope","phone":"1"},"items":[]}}' ;;
  status) call "{\"action\":\"order_status\",\"orderNumber\":\"$2\",\"email\":\"${3:-$EMAIL}\"}" ;;
esac
