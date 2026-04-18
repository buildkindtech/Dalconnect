#!/usr/bin/env bash
# DalKonnect Site Guardian (every 3h)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-guardian.log"
cd "$DALCONNECT_DIR"

OUTPUT=$(node scripts/site-guardian.cjs 2>&1)
echo "[$(date)] $OUTPUT" >> "$LOG"

if echo "$OUTPUT" | grep -q "__GUARDIAN_ALERT__"; then
  ALERT=$(echo "$OUTPUT" | grep -A5 "__GUARDIAN_ALERT__")
  tg_send "$DALCONNECT_CHAT" "🚨 Site Guardian 알림:\n$ALERT"
fi
# 정상이면 조용히 (HEARTBEAT_OK)
