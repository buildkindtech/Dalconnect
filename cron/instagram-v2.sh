#!/usr/bin/env bash
set -euo pipefail

BASE="${DALCONNECT_DIR:-/Users/aaron/Projects/dalconnect}"
NODE="${NODE:-/opt/homebrew/bin/node}"

cd "$BASE"
exec "$NODE" "$BASE/cron/instagram-v2.cjs" "$@"
