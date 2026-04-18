#!/usr/bin/env bash
# Daily Status Sync — MEMORY.md 업데이트 (매일 4am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/daily-status-sync.log"

echo "[$(date)] 상태 싱크 시작" >> "$LOG"
node "$WORKSPACE_DIR/scripts/daily-status-sync.mjs" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
