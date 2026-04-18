#!/usr/bin/env bash
# DalKonnect Groupon DFW 딜 갱신 (월요일 9am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-groupon.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] Groupon 딜 갱신 시작" >> "$LOG"
node scripts/auto-update-groupon.cjs >> "$LOG" 2>&1
EXIT_CODE=$?
echo "[$(date)] 완료 (exit=$EXIT_CODE)" >> "$LOG"

if [ $EXIT_CODE -ne 0 ]; then
  tg_send "$DALCONNECT_CHAT" "⚠️ Groupon 딜 갱신 실패 (exit $EXIT_CODE)"
fi
