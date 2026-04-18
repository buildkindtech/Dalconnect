#!/usr/bin/env bash
# DalKonnect 블로그 큐레이션 (매일 10am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-blog.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] 블로그 큐레이션 시작" >> "$LOG"
node scripts/auto-blog-curate.cjs >> "$LOG" 2>&1
EXIT_CODE=$?
echo "[$(date)] 완료 (exit=$EXIT_CODE)" >> "$LOG"

if [ $EXIT_CODE -ne 0 ]; then
  tg_send "$DALCONNECT_CHAT" "⚠️ 블로그 큐레이션 에러 (exit $EXIT_CODE)"
fi
