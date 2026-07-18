#!/bin/zsh
set -euo pipefail

BASE="${DALCONNECT_DIR:-/Users/aaron/Projects/dalconnect}"
cd "$BASE"

# Revalidate or regenerate today's immutable package before attempting publication.
/opt/homebrew/bin/node "$BASE/cron/instagram-v2.cjs" --skip-existing
exec /opt/homebrew/bin/node "$BASE/cron/instagram-v2-post.cjs" --publish
