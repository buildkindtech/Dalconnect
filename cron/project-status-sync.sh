#!/usr/bin/env bash
# Project Status Auto-Sync (매일 7am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/project-status-sync.log"

echo "[$(date)] 프로젝트 상태 싱크 시작" >> "$LOG"
node "$WORKSPACE_DIR/scripts/sync-project-status.cjs" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
