#!/usr/bin/env bash
# DalKonnect DB 백업 (매일 3am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-db-backup.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] DB 백업 시작" >> "$LOG"
DATABASE_URL="$DATABASE_URL" node scripts/db-backup.cjs >> "$LOG" 2>&1
EXIT_CODE=$?
echo "[$(date)] 완료 (exit=$EXIT_CODE)" >> "$LOG"

if [ $EXIT_CODE -ne 0 ]; then
  tg_send "$AARON_DM" "⚠️ DalKonnect DB 백업 실패 (exit $EXIT_CODE) — $(date)"
fi
# 성공이면 조용히
