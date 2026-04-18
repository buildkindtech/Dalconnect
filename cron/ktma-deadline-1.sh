#!/usr/bin/env bash
# KTMA Shop + Kiosk Deadline (4/14 8am — 1회성)
source "$(dirname "$0")/env.sh"
LOG="/tmp/ktma-deadline-1.log"

echo "[$(date)] KTMA Phase 1 체크포인트 (Week 2)" >> "$LOG"
/opt/homebrew/bin/claude --dangerously-skip-permissions -p "
KTMA Phase 1 체크포인트 (Week 2). 오늘: $(date '+%Y년 %m월 %d일')

확인사항:
1. 온라인 스토어(Shop 페이지) 라이브 여부 — https://mykoreantiger.com/shop 접속 확인
2. 아이패드 체크인 키오스크 설치 완료 여부 — /Users/aaron/.openclaw/workspace/memory/projects/martialos.md 확인
3. /Users/aaron/.openclaw/workspace/projects.json 에서 KTMA 해당 태스크 상태 업데이트

KTMA 텔레그램(-4932223926)에 한국어 반말로 보고:
curl -s -X POST 'https://api.telegram.org/bot$BOT_TOKEN/sendMessage' --data-urlencode 'chat_id=-4932223926' --data-urlencode 'text=[체크포인트 결과]'

BOT_TOKEN: $BOT_TOKEN
" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
