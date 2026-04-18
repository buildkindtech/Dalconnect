#!/usr/bin/env bash
# Daily Group Memory Sync (매일 2am)
source "$(dirname "$0")/env.sh"
LOG="/tmp/group-memory-sync.log"

echo "[$(date)] 그룹 메모리 싱크 시작" >> "$LOG"
/opt/homebrew/bin/claude --dangerously-skip-permissions -p "
그룹 메모리 싱크. 오늘: $(date '+%Y-%m-%d'), 어제: $(date -v-1d '+%Y-%m-%d')

1. /Users/aaron/.openclaw/workspace/memory/groups/ 폴더 스캔
2. 어제 대화 내용 중 기록 누락 있으면 각 파일에 추가
3. 완료 후 간단 보고 (터미널 출력만, Telegram 전송 불필요)
" >> "$LOG" 2>&1
echo "[$(date)] 완료" >> "$LOG"
