#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-ig-story.log"
echo "[$(date)] IG 스토리 생성 시작" >> "$LOG"
/opt/homebrew/bin/node "$(dirname "$0")/ig-story.cjs" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
