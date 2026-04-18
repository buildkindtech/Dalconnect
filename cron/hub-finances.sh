#!/usr/bin/env bash
# Hub-Finances Daily Brief (매일 8am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/hub-finances.log"

echo "[$(date)] Hub-Finances 브리프 시작" >> "$LOG"
# 환경변수 로드
set -a; source "$WORKSPACE_DIR/.env"; set +a

OUTPUT=$(cd "$WORKSPACE_DIR" && node scripts/finance-daily.mjs 2>&1)
echo "$OUTPUT" >> "$LOG"

if [ -n "$OUTPUT" ]; then
  tg_send "-5271905073" "$OUTPUT"
fi
