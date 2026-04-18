#!/usr/bin/env bash
# DalKonnect 공감콘텐츠 야간 후보 선정 (매일 9pm)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-empathy.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] 공감콘텐츠 후보 선정 시작" >> "$LOG"
node scripts/daily-empathy-preview.cjs >> "$LOG" 2>&1
EXIT_CODE=$?
echo "[$(date)] 완료 (exit=$EXIT_CODE)" >> "$LOG"

if [ $EXIT_CODE -ne 0 ]; then
  # 스크립트 실패 시 claude로 직접 생성
  /opt/homebrew/bin/claude -p "
DalKonnect 공감 콘텐츠 후보 선정.
오늘 요일: $(date '+%A')

DB에서 오늘 요일 테마에 맞는 공감글 1개 선택하고
표지 슬라이드 이미지 Puppeteer로 생성해서
텔레그램 -5280678324 방에 전송해줘.
프로젝트 위치: /Users/aaron/.openclaw/workspace-manager/projects/dalconnect
DATABASE_URL: $DATABASE_URL
BOT_TOKEN: $BOT_TOKEN
'올려' 받으면 5장 캐러셀 만들어 IG 포스팅 준비한다고 안내해줘.
" >> "$LOG" 2>&1
fi
