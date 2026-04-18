#!/usr/bin/env bash
# DalKonnect 아침 브리핑 완전 자동 (매일 4:45am)
# 뉴스 선별 → TTS → Leda 음성 → Whisper → 렌더 → 썸네일 → Telegram 미리보기
# Aaron은 "올려"만 하면 됨
source "$(dirname "$0")/env.sh"

exec "$(dirname "$0")/briefing-full-auto.sh" "$@"
