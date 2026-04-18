#!/usr/bin/env bash
# DalKonnect 커뮤니티 자동시드 (9시 시작, 4시간마다)
source "$(dirname "$0")/env.sh"
LOG="/tmp/dalconnect-community.log"
cd "$DALCONNECT_DIR"

echo "[$(date)] 커뮤니티 시드 시작" >> "$LOG"
node scripts/auto-community-seed.cjs 2>&1 | tail -20 >> "$LOG"
