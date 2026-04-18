#!/usr/bin/env bash
# DalKonnect 종합 통계 리포트 (매일 7:30am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-analytics.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] 통계 리포트 시작" >> "$LOG"
OUTPUT=$(node scripts/analytics-full-report.cjs 2>&1)
echo "$OUTPUT" >> "$LOG"

# __REPORT_START__ ~ __REPORT_END__ 사이 내용 추출해서 Telegram 전송
REPORT=$(echo "$OUTPUT" | sed -n '/__REPORT_START__/,/__REPORT_END__/p' | grep -v "__REPORT_" | head -80)

if [ -n "$REPORT" ]; then
  tg_send "$DALCONNECT_CHAT" "📊 달커넥트 일일 통계\n\n$REPORT"
else
  tg_send "$DALCONNECT_CHAT" "📊 통계 리포트 완료 ($(date '+%m/%d'))"
fi
