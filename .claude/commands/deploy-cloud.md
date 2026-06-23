---
description: Walk through deploying / redeploying the cloud backend and catch config gaps
allowed-tools: Bash, Read
---

Help deploy or redeploy `apps/cloud/` (Render/Railway). Read
`.claude/references/deployment.md` first.

Pre-flight checks (report each):
- `apps/cloud/Dockerfile` + `railway.json` present; `/health` route exists.
- `requirements.txt` includes `cryptography` (needed for ES256/JWKS).
- Confirm the env the deployed service NEEDS (these live in the platform dashboard, NOT the
  gitignored `.env`): `SUPABASE_URL`, `JWT_ALG=ES256`, `AUTH_DEV_MODE=0`, `DATABASE_URL`
  (Supabase **pooler** URI — not the IPv6-only direct host), `DEEPSEEK_*`, `SEPAY_*`,
  `CORS_ALLOWED_ORIGINS` (must include the deployed web origin).
- Do NOT set `PORT` (platform injects it).

Then verify the live service if a URL is provided as `$ARGUMENTS`:
- `GET /health` → 200, `GET /v1/plans` → 200, `GET /v1/me` (no token) → 401 (not 500).
- CORS preflight from the web origin returns `access-control-allow-origin`.

Flag anything still pointing at placeholders or the wrong DB host. Never print secrets.
