#!/usr/bin/env bash
# 아침 브리핑 Phase 3 — 전체 파이프라인
# WAV 파일 입력 → Whisper → 렌더 → 썸네일 → 포스팅
#
# 사용법:
#   ./briefing-pipeline.sh YYYY-MM-DD /path/to/voice_raw.wav
#
# 예시:
#   ./briefing-pipeline.sh 2026-04-10 /tmp/뉴스브리핑0410.wav
#
# 요구 사항:
#   - ffmpeg, whisper 설치 필요
#   - node_modules에 puppeteer, firebase-admin, node-fetch 등 설치 필요
#   - briefing-config.json은 Whisper 전사 후 자동 생성됨

set -euo pipefail

DATE="${1:-}"
WAV_FILE="${2:-}"

if [[ -z "$DATE" || -z "$WAV_FILE" ]]; then
  echo "사용법: $0 YYYY-MM-DD /path/to/voice_raw.wav"
  exit 1
fi

if [[ ! -f "$WAV_FILE" ]]; then
  echo "❌ WAV 파일 없음: $WAV_FILE"
  exit 1
fi

BASE="/Users/aaron/.openclaw/workspace-manager/projects/dalconnect"
DATE_DIR="$BASE/memory/morning-reels/$DATE"
CONFIG="$DATE_DIR/briefing-config.json"
LOG="/tmp/dalconnect-briefing-pipeline-$DATE.log"

mkdir -p "$DATE_DIR"
echo "[$(date)] Phase 3 파이프라인 시작 ($DATE)" | tee -a "$LOG"

# ── Step 1: ffmpeg 1.2x 속도 변환 ─────────────────────────
VOICE_RAW="$DATE_DIR/voice_raw.wav"
VOICE_FAST="$DATE_DIR/voice_1.20x.mp3"

echo "[$(date)] Step 1: 원본 WAV 복사 + 1.2배속 변환" | tee -a "$LOG"
if [[ "$(realpath "$WAV_FILE")" != "$(realpath "$VOICE_RAW")" ]]; then
  cp "$WAV_FILE" "$VOICE_RAW"
fi

ffmpeg -y -i "$VOICE_RAW" \
  -filter:a "atempo=1.2" \
  -c:a libmp3lame -b:a 192k \
  "$VOICE_FAST" 2>>"$LOG"

DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$VOICE_FAST")
echo "[$(date)] ✅ 1.2x 변환 완료 ($DURATION 초)" | tee -a "$LOG"

# ── Step 2: Whisper 전사 (mlx_whisper — Apple Silicon 최적화) ──
WHISPER_JSON="$DATE_DIR/voice_1.20x.json"
WHISPER_BASE="${VOICE_FAST%.mp3}"
BASENAME="${WHISPER_BASE##*/}"

echo "[$(date)] Step 2: mlx_whisper 전사 시작 (Apple Silicon)" | tee -a "$LOG"

MLX_WHISPER="/opt/homebrew/bin/mlx_whisper"
if [[ ! -x "$MLX_WHISPER" ]]; then
  echo "❌ mlx_whisper 없음 — pip install mlx-whisper" | tee -a "$LOG"
  exit 1
fi

"$MLX_WHISPER" "$VOICE_FAST" \
  --model mlx-community/whisper-small-mlx \
  --language Korean \
  --word-timestamps True \
  --output-format json \
  --output-dir "$DATE_DIR" \
  2>>"$LOG"

# mlx_whisper: 파일명에서 첫번째 점까지만 이름으로 사용 (voice_1.20x.mp3 → voice_1.json)
# 다양한 패턴 시도
MLX_OUT=""
for candidate in \
  "$DATE_DIR/${BASENAME}.json" \
  "$DATE_DIR/$(echo "$BASENAME" | cut -d. -f1).json"; do
  if [[ -f "$candidate" && "$candidate" != "$WHISPER_JSON" ]]; then
    MLX_OUT="$candidate"; break
  fi
done
if [[ -n "$MLX_OUT" ]]; then
  mv "$MLX_OUT" "$WHISPER_JSON"
fi

if [[ ! -f "$WHISPER_JSON" ]]; then
  echo "❌ Whisper JSON 없음: $WHISPER_JSON" | tee -a "$LOG"
  exit 1
fi

echo "[$(date)] ✅ Whisper 전사 완료" | tee -a "$LOG"

# ── Step 2.5: briefing-config.json 자동 생성 ───────────────
echo "[$(date)] Step 2.5: briefing-config.json 자동 생성" | tee -a "$LOG"
/opt/homebrew/bin/node "$BASE/cron/briefing-auto-config.cjs" "$DATE" 2>&1 | tee -a "$LOG"

if [[ ! -f "$CONFIG" ]]; then
  echo "❌ briefing-config.json 생성 실패" | tee -a "$LOG"
  exit 1
fi
echo "[$(date)] ✅ briefing-config.json 생성 완료" | tee -a "$LOG"

# ── Step 3: 렌더링 ─────────────────────────────────────────
echo "[$(date)] Step 3: 릴스 렌더링 시작" | tee -a "$LOG"
/opt/homebrew/bin/node "$BASE/cron/briefing-render.cjs" "$DATE" 2>&1 | tee -a "$LOG"
echo "[$(date)] ✅ 렌더링 완료" | tee -a "$LOG"

# ── Step 4: 썸네일 ─────────────────────────────────────────
echo "[$(date)] Step 4: 썸네일 생성" | tee -a "$LOG"
/opt/homebrew/bin/node "$BASE/cron/briefing-thumbnail.cjs" "$DATE" 2>&1 | tee -a "$LOG"
echo "[$(date)] ✅ 썸네일 완료" | tee -a "$LOG"

# ── Step 5: 미리보기 전송 (포스팅 X — Aaron 승인 대기) ────────
echo "[$(date)] Step 5: 미리보기 Telegram 전송" | tee -a "$LOG"

BOT_TOKEN="8675191741:AAF9c5aO_1OZdH3c6iXkyo4IMWG0Im4fyQY"
CHAT_ID="-5280678324"
THUMB="$DATE_DIR/thumbnail.jpg"
VIDEO="$DATE_DIR/news-briefing-${DATE//"-"/}.mp4"
# 파일명 패턴 fallback
if [[ ! -f "$VIDEO" ]]; then
  VIDEO=$(ls "$DATE_DIR"/news-briefing-*.mp4 2>/dev/null | head -1)
fi

# 썸네일 전송
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto" \
  -F "chat_id=${CHAT_ID}" \
  -F "photo=@${THUMB}" \
  -F "caption=🎬 ${DATE} 아침 브리핑 미리보기 — 확인 후 '올려' 라고 답장해주세요" \
  >> "$LOG" 2>&1

# 영상 전송
if [[ -f "$VIDEO" ]]; then
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendVideo" \
    -F "chat_id=${CHAT_ID}" \
    -F "video=@${VIDEO}" \
    -F "caption=📹 영상 확인 후 '올려' → 포스팅 진행" \
    >> "$LOG" 2>&1
fi

echo "[$(date)] ✅ 미리보기 전송 완료 — Aaron 승인 대기" | tee -a "$LOG"
echo "[$(date)] 🎉 Phase 3 파이프라인 완료 (포스팅 대기 중)!" | tee -a "$LOG"

# ── 포스팅은 Aaron이 '올려' 승인 후 수동 실행 ──────────────
# node "$BASE/cron/briefing-post.cjs" "$DATE"
