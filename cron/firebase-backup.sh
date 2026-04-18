#!/usr/bin/env bash
# DalKonnect Firebase 백업 (일요일 4am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-firebase-backup.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] Firebase 백업 시작" >> "$LOG"
# .env에서 추가 환경변수 로드
set -a; source .env; set +a
node scripts/backup-firebase-photos.cjs >> "$LOG" 2>&1
EXIT_CODE=$?
echo "[$(date)] 완료 (exit=$EXIT_CODE)" >> "$LOG"

if [ $EXIT_CODE -ne 0 ]; then
  tg_send "$AARON_DM" "⚠️ Firebase 백업 실패 (exit $EXIT_CODE) — $(date)"
fi
