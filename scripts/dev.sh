#!/usr/bin/env bash
# Vidova — start the whole stack with one command.
#
#   scripts/dev.sh             render (:8000) + cloud (:8787) + web (:5173)
#   scripts/dev.sh --no-cloud  skip the cloud backend
#
# The cloud backend is ON by default so the Dashboard/Billing pages work out of
# the box (otherwise the web app shows "Couldn't reach the cloud backend").
# Ctrl-C stops everything. Requires: uv (Python) and pnpm (Node) installed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_CLOUD=1
[[ "${1:-}" == "--no-cloud" ]] && WITH_CLOUD=0

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
  if [ -f apps/cloud/.env ]; then
    # Use the operator's real config (SUPABASE_JWT_SECRET, DEEPSEEK, SePay…).
    # uvicorn --env-file loads it BEFORE importing the app (so module-level
    # os.getenv sees it); tests don't use --env-file, so they stay hermetic.
    echo "▸ cloud backend    → http://127.0.0.1:8787   (env from apps/cloud/.env)"
    (
      cd apps/cloud
      uv run --no-project --with-requirements requirements.txt \
        uvicorn app.main:app --port 8787 --env-file .env
    ) &
  else
    echo "▸ cloud backend    → http://127.0.0.1:8787   (dev auth — no apps/cloud/.env)"
    (
      cd apps/cloud
      AUTH_DEV_MODE=1 ADMIN_API_KEY=dev DATABASE_URL="sqlite:///./dev.db" \
        uv run --no-project --with-requirements requirements.txt \
        uvicorn app.main:app --port 8787
    ) &
  fi
  pids+=($!)
fi

echo "▸ web              → http://localhost:5173"
pnpm --filter @mpt/web dev &
pids+=($!)

echo ""
echo "All services starting. Press Ctrl-C to stop."
wait
