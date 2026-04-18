#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"
LOG="/tmp/ktma-weekly.log"
echo "[$(date)] KTMA 주간 리포트 시작" >> "$LOG"
/opt/homebrew/bin/node "$(dirname "$0")/ktma-weekly.cjs" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
