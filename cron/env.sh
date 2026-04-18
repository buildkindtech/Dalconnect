#!/usr/bin/env bash
# 공통 환경 설정 — 모든 cron 스크립트에서 source 해서 사용
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="/Users/aaron"
export DALCONNECT_DIR="/Users/aaron/.openclaw/workspace-manager/projects/dalconnect"
export WORKSPACE_DIR="/Users/aaron/.openclaw/workspace"
export BOT_TOKEN="8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY"
export DALCONNECT_CHAT="-5280678324"
export AARON_DM="7966628100"
export KTMA_CHAT="-4932223926"
export HUB_FINANCES_CHAT="-5271905073"
export MONARCH_CHAT="-5052982119"
export HEALTH_CHAT="-5159157199"
export DEVOTION_CHAT="-1003732131830"
export HUB_OPS_CHAT="-5257747400"
export DATABASE_URL="postgresql://neondb_owner:npg_i0WIuEK3jtvd@ep-proud-shadow-ae72irn5-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"
export GOOGLE_AI_KEY="AIzaSyAhF8MA0mxt6PfmJMwMGABUNyxXoBnBYO0"

# Telegram 메시지 전송 헬퍼
tg_send() {
  local chat_id="$1"
  local text="$2"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${chat_id}" \
    --data-urlencode "text=${text}" \
    -d "parse_mode=HTML" > /dev/null
}

# 로컬 라우터 트리거 — Claude가 처리해서 Telegram으로 응답
# 사용법: tg_trigger <chat_id> <claude_prompt> [notify_text]
# - chat_id: 응답받을 채팅 ID
# - claude_prompt: Claude에게 보낼 프롬프트
# - notify_text (선택): Claude 실행 전 먼저 그룹에 보여줄 알림 메시지
tg_trigger() {
  local chat_id="$1"
  local prompt="$2"
  local notify="${3:-}"
  local payload
  if [ -n "$notify" ]; then
    payload=$(printf '{"chat_id":"%s","prompt":%s,"notify":%s}' \
      "$chat_id" \
      "$(echo "$prompt" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')" \
      "$(echo "$notify" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")
  else
    payload=$(printf '{"chat_id":"%s","prompt":%s}' \
      "$chat_id" \
      "$(echo "$prompt" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")
  fi
  curl -s -X POST http://127.0.0.1:7867/trigger \
    -H 'Content-Type: application/json' \
    -d "$payload" > /dev/null
}

# Telegram 파일 전송 헬퍼
tg_send_file() {
  local chat_id="$1"
  local file_path="$2"
  local caption="$3"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendDocument" \
    -F "chat_id=${chat_id}" \
    -F "document=@${file_path}" \
    -F "caption=${caption}" > /dev/null
}
