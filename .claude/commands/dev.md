---
description: Start the full local stack (render + cloud + web) and report what's up
allowed-tools: Bash, Read
---

Start the local development stack and confirm each service is reachable.

Context:
- Current git branch: !`git branch --show-current`
- Ports in use (8000 render / 8787 cloud / 5173 web): !`lsof -i :8000 -i :8787 -i :5173 -sTCP:LISTEN -P 2>/dev/null | tail -n +1 | head`

Run `pnpm dev` (which runs `scripts/dev.sh`: render :8000 + cloud :8787 + web :5173).
If the user passed `$ARGUMENTS`, forward them (e.g. `--no-cloud`).

Then verify and report a short status table:
- render: `curl -fsS http://127.0.0.1:8000/api/v1/ping` → expect `"pong"`
- cloud: `curl -fsS http://127.0.0.1:8787/health` → expect `{"status":"ok"}`
- web: `http://localhost:5173`

If a service fails, diagnose the real cause (check the dev.sh output, `.env`, ports) — do
not guess. Common gotcha: local web must point `VITE_CLOUD_BASE_URL` at the LOCAL cloud
(`http://127.0.0.1:8787`), and the local cloud's `CORS_ALLOWED_ORIGINS` must include
`http://localhost:5173`.
