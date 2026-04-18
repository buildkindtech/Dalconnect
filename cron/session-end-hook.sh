#!/usr/bin/env bash
# Session End Hook — Claude Code 세션 종료 시 자동 실행
# settings.json Stop hook에서 호출됨
# 역할: 오늘 일지가 비어있거나 없으면 최소한의 타임스탬프 기록

TODAY=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M')
MEMORY_DIR="/Users/aaron/.openclaw/workspace/memory"
OUTPUT="$MEMORY_DIR/$TODAY.md"

# 파일 없으면 기본 틀 생성
if [ ! -f "$OUTPUT" ]; then
  cat > "$OUTPUT" << HEADER
# $TODAY 작업 일지

HEADER
fi

# 마지막 줄이 이미 세션 기록이면 중복 방지
LAST=$(tail -1 "$OUTPUT" 2>/dev/null)
if echo "$LAST" | grep -q "세션 종료"; then
  exit 0
fi

echo "" >> "$OUTPUT"
echo "<!-- 세션 종료: $TIME -->" >> "$OUTPUT"
