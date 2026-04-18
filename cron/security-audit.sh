#!/usr/bin/env bash
# Security Audit (매일 6am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/security-audit.log"

echo "[$(date)] 보안 감사 시작" >> "$LOG"

# 리스닝 포트 확인
PORTS=$(/usr/sbin/lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null)
echo "$PORTS" >> "$LOG"

# 외부 바인딩 확인 (0.0.0.0 또는 *:PORT)
EXTERNAL=$(echo "$PORTS" | grep -v "127.0.0.1" | grep -v "::1" | grep -v "COMMAND" | grep -E "\*:|0\.0\.0\.0:")

if [ -n "$EXTERNAL" ]; then
  tg_send "-5257747400" "🚨 보안 경고: 외부 포트 감지됨\n$EXTERNAL"
  echo "[$(date)] 경고 발송" >> "$LOG"
else
  echo "[$(date)] ALL CLEAR" >> "$LOG"
fi
