#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"
LOG="/tmp/morning-project-sync.log"
echo "[$(date)] Morning Project Sync 시작" >> "$LOG"
/opt/homebrew/bin/node "$(dirname "$0")/morning-project-sync.cjs" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
