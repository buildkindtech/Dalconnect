#!/usr/bin/env bash
# Daily Workspace Backup (매일 11pm)
source "$(dirname "$0")/env.sh"
LOG="/tmp/workspace-backup.log"
cd "$WORKSPACE_DIR"

echo "[$(date)] 워크스페이스 백업 시작" >> "$LOG"

git add memory/ skills/ MEMORY.md AGENTS.md TOOLS.md HEARTBEAT.md projects.json .gitignore 2>> "$LOG"
git commit -m "auto backup $(date '+%Y-%m-%d %H:%M')" >> "$LOG" 2>&1
git push origin main >> "$LOG" 2>&1
EXIT_CODE=$?

echo "[$(date)] 완료 (exit=$EXIT_CODE)" >> "$LOG"

if [ $EXIT_CODE -ne 0 ]; then
  tg_send "$AARON_DM" "⚠️ 워크스페이스 백업 push 실패 — $(date)"
fi
