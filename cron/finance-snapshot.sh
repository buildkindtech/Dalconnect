#!/usr/bin/env bash
# 재정 잔고 주간 스냅샷 (월요일 8:20am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/finance-snapshot.log"
NODE="/opt/homebrew/bin/node"

echo "[$(date)] 재정 스냅샷 시작" >> "$LOG"
set -a; source "$WORKSPACE_DIR/.env" 2>/dev/null || true; set +a

# Gemini 기반 분석 (claude -p 대체)
$NODE "$(dirname "$0")/finance-snapshot.cjs" >> "$LOG" 2>&1

echo "[$(date)] 완료" >> "$LOG"
