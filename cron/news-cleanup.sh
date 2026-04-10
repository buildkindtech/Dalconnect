#!/usr/bin/env bash
# DalKonnect 뉴스 정리 90일 (매일 2am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-news-cleanup.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] 뉴스 정리 시작" >> "$LOG"
# JS 코드 오염 기사 삭제
node scripts/deep-clean-news.cjs >> "$LOG" 2>&1
# 90일 이상 오래된 기사 삭제
node scripts/cleanup-old-news.cjs >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
