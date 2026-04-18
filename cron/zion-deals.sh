#!/usr/bin/env bash
# DalKonnect 시온마트 주간 세일 갱신 (목요일 7am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-zion.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] 시온마트 세일 갱신 시작" >> "$LOG"
node scripts/auto-update-zion.cjs >> "$LOG" 2>&1
EXIT_CODE=$?
echo "[$(date)] 완료 (exit=$EXIT_CODE)" >> "$LOG"

if [ $EXIT_CODE -ne 0 ]; then
  tg_send "$DALCONNECT_CHAT" "⚠️ 시온마트 세일 갱신 실패 (exit $EXIT_CODE)"
fi
