#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-biz-closeup.log"
echo "[$(date)] 업소 클로즈업 시작" >> "$LOG"
/opt/homebrew/bin/node "$(dirname "$0")/biz-closeup.cjs" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
