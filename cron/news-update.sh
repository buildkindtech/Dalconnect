#!/usr/bin/env bash
# DalKonnect 뉴스 자동수집 및 보강 (6am, 11am, 6pm)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-news-full.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] 뉴스 자동수집 시작" >> "$LOG"

# 1. 뉴스 수집
GOOGLE_AI_KEY="$GOOGLE_AI_KEY" node scripts/auto-news-update.cjs >> "$LOG" 2>&1
# 2. JS 코드 오염 기사 즉시 삭제 (수집 직후)
node scripts/deep-clean-news.cjs >> "$LOG" 2>&1
# 3. 미번역 기사 재번역
node scripts/fix-untranslated.cjs --limit=30 >> "$LOG" 2>&1
# 4. 내용 없는 뉴스 AI 채우기
node scripts/enrich-news-ai.cjs --limit=100 --batch=15 >> "$LOG" 2>&1
# 5. 영어 기사 번역
node scripts/translate-english-v2.cjs 50 >> "$LOG" 2>&1
# 6. 찌꺼기 정리 한 번 더
node scripts/deep-clean-news.cjs >> "$LOG" 2>&1
# 7. 품질 체크
GOOGLE_AI_KEY="$GOOGLE_AI_KEY" node scripts/quality-check.cjs >> "$LOG" 2>&1

EXIT_CODE=$?
echo "[$(date)] 완료 (exit=$EXIT_CODE)" >> "$LOG"

if [ $EXIT_CODE -ne 0 ]; then
  tg_send "$DALCONNECT_CHAT" "⚠️ 뉴스 자동수집 에러 (exit $EXIT_CODE) — /tmp/dalconnect-news-full.log 확인"
fi
