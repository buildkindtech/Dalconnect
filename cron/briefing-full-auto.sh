#!/usr/bin/env bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 아침 브리핑 완전 자동 파이프라인
# 뉴스 선별 → TTS 스크립트 → Leda 음성 → Whisper → 렌더 → 썸네일 → Telegram 미리보기
# Aaron은 "올려"만 하면 됨
#
# 사용법:
#   ./briefing-full-auto.sh              # 오늘 날짜 자동
#   ./briefing-full-auto.sh 2026-04-13   # 특정 날짜
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
set -euo pipefail

BASE="/Users/aaron/.openclaw/workspace-manager/projects/dalconnect"
NODE="/opt/homebrew/bin/node"
DATE="${1:-$(date +%Y-%m-%d)}"
DATE_DIR="$BASE/memory/morning-reels/$DATE"
LOG="/tmp/dalconnect-briefing-full-auto-$DATE.log"

BOT_TOKEN="8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY"
CHAT_ID="-5280678324"

mkdir -p "$DATE_DIR"
echo "[$(date)] ━━━ 완전 자동 파이프라인 시작 ($DATE) ━━━" | tee "$LOG"

# 채널에 시작 알림
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  --data-urlencode "text=🔄 아침 브리핑 파이프라인 시작 ($DATE)..." >> "$LOG" 2>&1

# ── Phase 1: 뉴스 자동 선별 + TTS 스크립트 생성 ──────────────
echo "[$(date)] Phase 1: 뉴스 선별 + TTS 스크립트" | tee -a "$LOG"
$NODE "$BASE/cron/news-candidates.cjs" 2>&1 | tee -a "$LOG"

if [[ ! -f "$DATE_DIR/tts-script.txt" ]]; then
  echo "❌ tts-script.txt 생성 실패" | tee -a "$LOG"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    --data-urlencode "text=❌ 브리핑 실패: Phase 1 (뉴스 스크립트 생성) 오류" >> "$LOG" 2>&1
  exit 1
fi
echo "[$(date)] ✅ Phase 1 완료 — TTS 스크립트 생성됨" | tee -a "$LOG"

# ── Phase 2: Google TTS Leda 음성 생성 ────────────────────────
echo "[$(date)] Phase 2: Leda TTS 음성 생성" | tee -a "$LOG"
$NODE "$BASE/cron/gen-leda-voice.cjs" "$DATE" 2>&1 | tee -a "$LOG"

VOICE_FAST="$DATE_DIR/voice_1.20x.mp3"
if [[ ! -f "$VOICE_FAST" ]]; then
  echo "❌ Leda 음성 생성 실패" | tee -a "$LOG"
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    --data-urlencode "text=❌ 브리핑 실패: Phase 2 (Leda TTS) 오류" >> "$LOG" 2>&1
  exit 1
fi
echo "[$(date)] ✅ Phase 2 완료 — Leda 1.2x 음성 생성됨" | tee -a "$LOG"

# ── Phase 3: Whisper 전사 ─────────────────────────────────────
echo "[$(date)] Phase 3: mlx_whisper 전사" | tee -a "$LOG"
WHISPER_JSON="$DATE_DIR/voice_1.20x.json"

MLX_WHISPER="/opt/homebrew/bin/mlx_whisper"
if [[ ! -x "$MLX_WHISPER" ]]; then
  echo "❌ mlx_whisper 없음" | tee -a "$LOG"
  exit 1
fi

# 기존 Whisper JSON 삭제 — 새 음성에 맞는 새 전사 필수
rm -f "$WHISPER_JSON"
rm -f "$DATE_DIR/voice_1.json"

"$MLX_WHISPER" "$VOICE_FAST" \
  --model mlx-community/whisper-small-mlx \
  --language Korean \
  --word-timestamps True \
  --output-format json \
  --output-dir "$DATE_DIR" \
  2>>"$LOG"

# mlx_whisper 파일명 보정 (voice_1.20x.mp3 → voice_1.json 등)
BASENAME="${VOICE_FAST##*/}"
BASENAME="${BASENAME%.mp3}"
for candidate in \
  "$DATE_DIR/${BASENAME}.json" \
  "$DATE_DIR/$(echo "$BASENAME" | cut -d. -f1).json"; do
  if [[ -f "$candidate" && "$candidate" != "$WHISPER_JSON" ]]; then
    mv -f "$candidate" "$WHISPER_JSON"; break
  fi
done

if [[ ! -f "$WHISPER_JSON" ]]; then
  echo "❌ Whisper JSON 없음" | tee -a "$LOG"
  exit 1
fi
echo "[$(date)] ✅ Phase 3 완료 — Whisper 전사됨" | tee -a "$LOG"

# ── Phase 4: briefing-config.json 자동 생성 ───────────────────
echo "[$(date)] Phase 4: briefing-config.json 생성" | tee -a "$LOG"
$NODE "$BASE/cron/briefing-auto-config.cjs" "$DATE" 2>&1 | tee -a "$LOG"

if [[ ! -f "$DATE_DIR/briefing-config.json" ]]; then
  echo "❌ briefing-config.json 생성 실패" | tee -a "$LOG"
  exit 1
fi
echo "[$(date)] ✅ Phase 4 완료" | tee -a "$LOG"

# ── Phase 5: 렌더링 ──────────────────────────────────────────
echo "[$(date)] Phase 5: 릴스 렌더링" | tee -a "$LOG"
$NODE "$BASE/cron/briefing-render.cjs" "$DATE" 2>&1 | tee -a "$LOG"
echo "[$(date)] ✅ Phase 5 완료 — 렌더링됨" | tee -a "$LOG"

# ── Phase 6: 썸네일 ──────────────────────────────────────────
echo "[$(date)] Phase 6: 썸네일 생성" | tee -a "$LOG"
$NODE "$BASE/cron/briefing-thumbnail.cjs" "$DATE" 2>&1 | tee -a "$LOG"
echo "[$(date)] ✅ Phase 6 완료 — 썸네일 생성됨" | tee -a "$LOG"

# ── Phase 7: Telegram 미리보기 전송 ──────────────────────────
echo "[$(date)] Phase 7: 미리보기 전송" | tee -a "$LOG"

# 영상 찾기
MMDD="${DATE:5:2}${DATE:8:2}"
VIDEO="$DATE_DIR/news-briefing-${MMDD}.mp4"
if [[ ! -f "$VIDEO" ]]; then
  VIDEO=$(ls "$DATE_DIR"/news-briefing-*.mp4 2>/dev/null | head -1)
fi
THUMB="$DATE_DIR/thumbnail.png"
if [[ ! -f "$THUMB" ]]; then
  THUMB="$DATE_DIR/thumbnail.jpg"
fi

if [[ -f "$VIDEO" && -f "$THUMB" ]]; then
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendVideo" \
    -F "chat_id=${CHAT_ID}" \
    -F "video=@${VIDEO}" \
    -F "thumbnail=@${THUMB}" \
    -F "caption=🎬 ${DATE} 아침 브리핑 — 확인 후 '올려'" \
    >> "$LOG" 2>&1
  echo "[$(date)] ✅ 미리보기 전송 완료" | tee -a "$LOG"
elif [[ -f "$VIDEO" ]]; then
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendVideo" \
    -F "chat_id=${CHAT_ID}" \
    -F "video=@${VIDEO}" \
    -F "caption=🎬 ${DATE} 아침 브리핑 — 확인 후 '올려'" \
    >> "$LOG" 2>&1
  echo "[$(date)] ✅ 영상 전송 완료 (썸네일 없음)" | tee -a "$LOG"
else
  echo "❌ 영상 파일 없음" | tee -a "$LOG"
  exit 1
fi

echo "[$(date)] ━━━ 완전 자동 파이프라인 완료 — '올려' 대기 ━━━" | tee -a "$LOG"
