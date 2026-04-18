#!/usr/bin/env bash
# KTMA App Launch + Newsletter Deadline (4/28 8am — 1회성)
source "$(dirname "$0")/env.sh"
LOG="/tmp/ktma-deadline-2.log"

echo "[$(date)] KTMA Phase 1 마감 체크 (4/30)" >> "$LOG"
/opt/homebrew/bin/claude --dangerously-skip-permissions -p "
KTMA Phase 1 마감 임박 체크 (4/30). 오늘: $(date '+%Y년 %m월 %d일')

확인사항:
1. 학부모/학생 PWA 앱 출시 상태 — /Users/aaron/.openclaw/workspace/memory/projects/martialos.md
2. 첫 뉴스레터 발송 완료 여부
3. Google 리뷰 자동화 가동 여부
4. 이메일/문자 드립 시퀀스 상태
5. /Users/aaron/.openclaw/workspace/projects.json Phase 1 태스크 상태 업데이트

KTMA 텔레그램(-4932223926)에 Phase 1 완료 리포트 한국어 반말로 보고:
curl -s -X POST 'https://api.telegram.org/bot$BOT_TOKEN/sendMessage' --data-urlencode 'chat_id=-4932223926' --data-urlencode 'text=[리포트]'

BOT_TOKEN: $BOT_TOKEN
" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
