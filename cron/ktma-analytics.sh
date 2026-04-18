#!/usr/bin/env bash
# KTMA Daily Analytics (매일 8:10am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/ktma-analytics.log"
NODE="/opt/homebrew/bin/node"

echo "[$(date)] KTMA 분석 시작" >> "$LOG"

# Gemini 기반 분석 (claude -p 대체)
$NODE "$(dirname "$0")/ktma-analytics.cjs" >> "$LOG" 2>&1

echo "[$(date)] 완료" >> "$LOG"
