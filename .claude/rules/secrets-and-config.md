# Secrets & configuration

**Never commit secrets.** This has bitten the project before (leaked DeepSeek keys in a
tracked `.env.example`). Rules:

- **Real secrets live only in gitignored `.env` files.** `.env.example` holds **placeholders
  only** (`your-supabase-jwt-secret`, `sk-...`). Both `apps/web/.env` and `apps/cloud/.env`
  are gitignored.
- If a secret is ever committed, treat it as **compromised**: rotate it, then scrub. Git
  history still contains it.
- **Do not paste secrets into shell commands** (they persist in transcripts/logs). Read them
  from the `.env` file inside a script instead.
- **Supabase keys are not interchangeable**:
  - `sb_publishable_…` = anon key (web `VITE_SUPABASE_ANON_KEY`).
  - `sb_secret_…` = service-role key (admin API only). **NOT** the JWT verification secret.
  - Modern projects sign JWTs with **ES256** → the cloud verifies via **JWKS** using
    `SUPABASE_URL`. There is no shared HS256 secret to set.
- **Local vs production config**:
  - `apps/web/.env` = local-dev values (`VITE_CLOUD_BASE_URL=http://127.0.0.1:8787`).
  - Production cloud URL goes in the **Vercel** project env, not the local file.
  - The deployed cloud's CORS/secret env live in the **Render/Railway dashboard**, not in
    the gitignored `.env` (editing the local file does not change the deployed service).
- **Tauri updater private key**: `~/.tauri/vidova-updater.key`. Never commit; CI uses the
  `TAURI_SIGNING_PRIVATE_KEY` repo secret.
- **Build artifacts are gitignored**: `apps/desktop/src-tauri/{target,binaries}/`,
  `apps/render/{build,dist}/`, `apps/render/.venv/`.
