#!/usr/bin/env bash
# Vidova — start the whole stack with one command.
#
#   scripts/dev.sh            render backend (:8000) + web (:5173)
#   scripts/dev.sh --cloud    also the cloud backend (:8787, dev auth + sqlite)
#
# Ctrl-C stops everything. Requires: uv (Python) and pnpm (Node) installed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_CLOUD=0
[[ "${1:-}" == "--cloud" ]] && WITH_CLOUD=1

pids=()
cleanup() {
  echo ""
  echo "▸ stopping…"
  for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "▸ render backend   → http://127.0.0.1:8000   (docs: /docs)"
( cd apps/render && uv run python main.py ) &
pids+=($!)

if [[ "$WITH_CLOUD" == "1" ]]; then
  echo "▸ cloud backend    → http://127.0.0.1:8787   (AUTH_DEV_MODE, admin key: dev)"
  (
    cd apps/cloud
    AUTH_DEV_MODE=1 ADMIN_API_KEY=dev DATABASE_URL="sqlite:///./dev.db" \
      uv run --no-project --with-requirements requirements.txt \
      uvicorn app.main:app --port 8787
  ) &
  pids+=($!)
fi

echo "▸ web              → http://localhost:5173"
pnpm --filter @mpt/web dev &
pids+=($!)

echo ""
echo "All services starting. Press Ctrl-C to stop."
wait
