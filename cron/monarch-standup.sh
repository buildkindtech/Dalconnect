#!/usr/bin/env bash
# Monarch Standup — Abe (월-목 8am)
# 스탠드업 시작 메시지 전송 — 이후 대화는 터미널 Claude 세션이 처리
source "$(dirname "$0")/env.sh"
LOG="/tmp/monarch-standup.log"

echo "[$(date)] Monarch 스탠드업 시작" >> "$LOG"
/opt/homebrew/bin/node "$(dirname "$0")/monarch-standup.cjs" >> "$LOG" 2>&1
EXIT_CODE=$?
echo "[$(date)] 완료 (exit=$EXIT_CODE)" >> "$LOG"
if [ $EXIT_CODE -ne 0 ]; then
  tg_send "7966628100" "⚠️ Monarch 스탠드업 실패 — 로그: /tmp/monarch-standup.log"
fi
