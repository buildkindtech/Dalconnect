#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"
LOG="/tmp/devotion.log"
echo "[$(date)] Devotion QT 시작" >> "$LOG"
/opt/homebrew/bin/node "$(dirname "$0")/devotion.cjs" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
