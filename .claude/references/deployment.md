# Vidova — deployment reference

## Cloud (`apps/cloud/`) → Render / Railway (free)
1. Web service, **Root Directory** = `apps/cloud`, runtime **Docker** (auto-detects `Dockerfile`).
2. **Health Check Path** = `/health`. Do NOT set `PORT` (the platform injects it).
3. Env vars (mirror `apps/cloud/.env`):
   - `SUPABASE_URL=https://<ref>.supabase.co` · `JWT_ALG=ES256` · `AUTH_DEV_MODE=0`
   - `DATABASE_URL` = Supabase **pooler** URI (`...pooler.supabase.com:5432`, session mode) —
     NOT the direct `db.<ref>.supabase.co:5432` host (IPv6-only → unreachable).
   - `DEEPSEEK_*`, `SIGNUP_CREDIT_GRANT`, `CREDITS_PER_CALL`
   - `SEPAY_*` (when billing is live)
   - `CORS_ALLOWED_ORIGINS` = web origin(s) + `tauri://localhost` (+ localhost for dev)
4. Free tier sleeps after ~15 min idle (cold start ~50s). Supabase free DB pauses after ~1 week idle.

## Web (`apps/web/`) → Vercel
- Set `VITE_CLOUD_BASE_URL` (Render URL) + `VITE_API_BASE_URL` + `VITE_SUPABASE_*` in the
  **Vercel project's Environment Variables** — NOT in `apps/web/.env` (that file is local-dev only).
- Add the deployed web origin to the cloud's `CORS_ALLOWED_ORIGINS`.
- In Supabase → Authentication → URL Configuration, add the web origin to Redirect URLs.

## Landing (`apps/landing/`) → Vercel
- Static Astro build. `site` in `astro.config.mjs` must match the deployed domain
  (canonical/OG/sitemap). Showcase videos live in `public/showcase/`.

## Desktop → GitHub Releases (auto-update)
- `pnpm release:desktop [ver]` tags `desktop-v<ver>`; CI (`.github/workflows/desktop-build.yml`)
  builds macOS/Windows/Linux installers + signed updater artifacts + `latest.json`.
- Requires repo secret `TAURI_SIGNING_PRIVATE_KEY` (matches `apps/desktop/src-tauri/tauri.conf.json` pubkey).
- `bundle.createUpdaterArtifacts: true` must stay on, or no `.sig`/`latest.json` are produced.
